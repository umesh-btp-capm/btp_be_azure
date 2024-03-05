const AzureFileHandlers = require('./handlers/azureFileHandlers'); //Import it for UPDATE operation
const uuid = require('uuid');                                       //STEP-2

module.exports.uploadAttachment = async (req) => {
    const { ATTACHMENTS } = cds.entities('btp.azure');

    //Initialize the transction
    const tx = cds.transaction(req);

    if (req.event === "UPDATE") {
        //Actual upload of data into azure

        //First we should take below 3 things from debugging                    //STEP-1
        //content- req.data.CONTENT
        //Type- req.data.MIMETYPE
        //filename - req.headers.slug   , we will find it in header


        //Create a container ID  Step-3
        var lv_container_id = uuid.v1();


        //Hnadlers to connect to Azure        Step-4                                   // STEP-2  Create this handlers in separete folder in srv
        //After importing the AzureFileHandlers we should write this one 
        var lo_azureFileHandler = new AzureFileHandlers(); //It wii return a object


        //Upload the attchements into azure , (After doing above step we do this step) Step-5
        var ls_uploadResponse = await lo_azureFileHandler.uploadFile(lv_container_id, req.headers.slug, req.user.id, req.data.MIMETYPE, req.data.CONTENT)


        //Update my DB  with the required file info  *(THIS IS LAST STEP OF UPDATE step-19)*
        const lr_update_fileinfo = await tx.run(
            UPDATE(ATTACHMENTS)
                .set({
                    AZURECONTAINER_ID: lv_container_id,
                    AZUREFILE_ID: ls_uploadResponse.fileID
                })
                .where('ID=', req.data.ID)
        )

    } else if (req.event === "CREATE") {                            //Complete the create first and after go UPDATE                  

        //Push the entry into db without ref. to azure

        //STEP- 1
        var lv_dynamic_id = uuid.v1();

        //Preapare Payload FOR values In step-5,    STEP-5 
        var ls_upload = {
            ID: lv_dynamic_id,
            NAME: req.data.FILENAME,
            MIMETYPE: req.data.MIMETYPE,
            createdAt: new Date().toISOString(),
            createdBy: req.user.id,
            modifiedAt: new Date().toISOString(),
            modifiedBy: req.user.id
        }

        //Insert a record into db-        STEP-4
        const lr_insert_att = await tx.run(
            INSERT.into(ATTACHMENTS)
                .columns('ID', 'NAME', 'MIMETYPE', 'createdAt', 'createdBy', 'modifiedAt', 'modifiedBy')

                //We created a payload fo this we can see it on above step-5
                .values(ls_upload.ID, ls_upload.NAME, ls_upload.MIMETYPE, ls_upload.createdAt, ls_upload.createdBy, ls_upload.modifiedAt, ls_upload.modifiedBy)

        )

        //Add ID into req.data and return,  (STEP-3)
        req.data.ID = lv_dynamic_id;
        return req.data;
    }
}

module.exports.downloadAttachment = async (req) => {
    const { ATTACHMENTS } = cds.entities('btp.azure');

    //Step-1 Initialize the transaction
    const tx = cds.transaction(req);

    //Step-2 Select the file data stored on to hana cloud DB
    const lr_attachment = await tx.run(
        SELECT.one.from(ATTACHMENTS)
            .columns('ID', 'NAME', 'MIMETYPE', 'AZURECONTAINER_ID', 'AZUREFILE_ID')
            .where('ID=', req.data.ID)
    )

    //
    if (lr_attachment) {
        //Connect to fileHandler
        var lo_azureFileHandler = new AzureFileHandlers(); //It wii return a object
        var ls_file = await lo_azureFileHandler.downloadFile(lr_attachment.AZURECONTAINER_ID, lr_attachment.AZUREFILE_ID)

        //Gateway based odata service
        //GET_STREAM
        //Header- filename & preview/download (inline/outline)
        //body - results- actual content
        //Prepare output data
        req.results = {};
        req.results.value = ls_file.StreamBody;

        //Header
        if (ls_file.contentType.toUpperCase().includes('IMAGE')) {
            req._.odataRes.setHeader('Content-Disposition', `inline; filename="${ls_file.filename}"`);
        } else {
            req._.odataRes.setHeader('Content-Disposition', `outline; filename="${ls_file.filename}"`);
        }

    }

}

module.exports.deleteAttachment = async (req) => {
    const { ATTACHMENTS } = cds.entities('btp.azure');

    //Step-1 Initialize the transaction
    const tx = cds.transaction(req);

    //Step-2 Select the file data stored on to hana cloud DB
    const lr_attachment = await tx.run(
        SELECT.one.from(ATTACHMENTS)
            .columns('ID', 'NAME', 'MIMETYPE', 'AZURECONTAINER_ID', 'AZUREFILE_ID')
            .where('ID=', req.data.ID)
    )

    if (lr_attachment) {
        //Connect to fileHandler
        var lo_azureFileHandler = new AzureFileHandlers(); //It wii return a object

        //Delete file
        var ls_delete_response = await lo_azureFileHandler.deleteFile(lr_attachment.AZURECONTAINER_ID, lr_attachment.AZUREFILE_ID)

        //If deletion is success, delete the entry of registry from hana db as well
        if (ls_delete_response !== 'Error') {
            const lr_delete_db = await tx.run(
                DELETE.from(ATTACHMENTS)
                    .where('ID=', req.data.ID)
            )
        }
    }
}