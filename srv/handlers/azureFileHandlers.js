const { BlobServiceClient } = require("@azure/storage-blob"); //step-2
const uuid= require('uuid');  
const {Readable}= require('stream')         //Step- 9

class FileHandlers {          //first we crete a class and createed deffirent method 

    async uploadFile(iv_containername,iv_actual_filename,iv_user,iv_content_type,iv_content){  //After creating empty method we can write code in main file

        //step-1
        var lv_sasurl='https://utrailstorageaccount.blob.core.windows.net/?sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2024-04-03T17:12:42Z&st=2024-03-03T06:30:00Z&spr=https,http&sig=f4i8E0h6jfiH7ZikoFkyBAMINSNcioQ%2Fo1Jyr6vsZdA%3D'

        //Connect to service client  Step-3
        const blobServiceClient = new BlobServiceClient(lv_sasurl)

        //Get the handle of a container  Step-4
        const containerClinet=blobServiceClient.getContainerClient(iv_containername)

        //Create a container   Step-5
        const createContainerResponse=await containerClinet.createIfNotExists();

        //Create a uniquie name    Step-6
        const lv_dynamic_azureFileId=uuid.v1();

        //Get the handle of a blob      Step-7
        const blobHandle=containerClinet.getBlockBlobClient(lv_dynamic_azureFileId);

        //convert the input Node js content into buffer     Step- 12 
        const ls_data_buffer=await this.streamToBuffer(iv_content)

        //Create a instance of Readable stream    Step- 10
        const readable=new Readable(); //this line only Step-10
        //Step- 13
        readable.push(Uint8Array.from(Buffer.from(ls_data_buffer, 'binary')));  
        readable._read= function() {};
        readable.push(null);

        //Define upload options   Step-14
        const FMB= 4*1024*1024;
        const uploadOprtions={
            bufferSize: FMB,
            maxBuffers:5
        }

        //Upload the File                   Step-8 
        await blobHandle.uploadStream(
            readable, //Only this line Step-8
            //Step- 15 
            uploadOprtions.bufferSize,
            uploadOprtions.maxBuffers
        )

        //set metadata     STEP-17-1                             
        var ls_metadata = {
            filename:iv_actual_filename,
            createdBy:iv_user
        }

        //STEP-17-2
        await blobHandle.setMetadata(ls_metadata);

        //set HTTPHeaders   Step-16
        await blobHandle.setHTTPHeaders({blobContentType: iv_content_type});

        //Step-18 After this step to main file "Update my DB  with the required file info"
        return {fileID: lv_dynamic_azureFileId}


    }

    async downloadFile(iv_containername,iv_azure_fileid){
        var lv_sasurl='https://utrailstorageaccount.blob.core.windows.net/?sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2024-04-03T17:12:42Z&st=2024-03-03T06:30:00Z&spr=https,http&sig=f4i8E0h6jfiH7ZikoFkyBAMINSNcioQ%2Fo1Jyr6vsZdA%3D'

        //Connect to service client
        const blobServiceClient = new BlobServiceClient(lv_sasurl)

        //Get the handle of a container 
        const containerClinet=blobServiceClient.getContainerClient(iv_containername)

        //Get the handle of a blob      
        const blobHandle=containerClinet.getBlockBlobClient(iv_azure_fileid);

        //Get the properties
        var ls_media_properties=await blobHandle.getProperties()

        //Download the filr
        var ls_downloadBlob=await blobHandle.download(0)

        //Return the content and Filename
        return {
            StreamBody: ls_downloadBlob.readableStreamBody,
            filename:ls_media_properties.metadata.filename,
            contentType:ls_media_properties.contentType
        }

    }

    async deleteFile(iv_containername,iv_azure_fileid){
        var lv_sasurl='https://utrailstorageaccount.blob.core.windows.net/?sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2024-04-03T17:12:42Z&st=2024-03-03T06:30:00Z&spr=https,http&sig=f4i8E0h6jfiH7ZikoFkyBAMINSNcioQ%2Fo1Jyr6vsZdA%3D'

        //Connect to service client
        const blobServiceClient = new BlobServiceClient(lv_sasurl)

        //Get the handle of a container 
        const containerClinet=blobServiceClient.getContainerClient(iv_containername)

        //Get the handle of a blob      
        const blobHandle=containerClinet.getBlockBlobClient(iv_azure_fileid);

        var ls_delete_response ='';

        try {
            const blobDeleteResponse=await blobHandle.delete()
            ls_delete_response='Success'
        } catch (error) {
            ls_delete_response='Error'
            
        }
        return ls_delete_response


    }

    streamToBuffer(readableStream) {            //Step- 11
        return new Promise((resolve, reject) => {
          const chunks = [];
          readableStream.on("data", (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
          });
          readableStream.on("end", () => {
            resolve(Buffer.concat(chunks));
          });
          readableStream.on("error", reject);
        });
      }
}

module.exports=FileHandlers;