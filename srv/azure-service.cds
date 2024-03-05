using btp.azure as be from '../db/data-model';

service AzureFileService {
    entity AttachmentsList as select from be.ATTACHMENTS;

    entity AttachmentsInt as select from be.ATTACHMENTS_INT;
}