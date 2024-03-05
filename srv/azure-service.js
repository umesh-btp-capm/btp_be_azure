const cds = require('@sap/cds');
const lo_attachmentHandler= require('./azureAttachmentsHandler');

module.exports=cds.service.impl(srv => {
    //Update  - PUT & POST
    srv.on(['CREATE','UPDATE'], 'AttachmentsInt', lo_attachmentHandler.uploadAttachment);

    //Download - GET
    srv.on('READ', 'AttachmentsInt', lo_attachmentHandler.downloadAttachment);

    //Delete   - DELETE
    srv.on('DELETE', 'AttachmentsInt', lo_attachmentHandler.deleteAttachment);
    
})