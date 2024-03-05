namespace btp.azure;
using {
    cuid,
    managed
} from '@sap/cds/common';

//entity to store mt relation of  Attachments with azure
entity ATTACHMENTS : cuid, managed {
    NAME              : String(255);
    MIMETYPE          : String(255);
    AZURECONTAINER_ID : String(255);
    AZUREFILE_ID      : String(255)
}

@cds.persistence.skip
entity ATTACHMENTS_INT {
    key ID       : String(36);

        @Core.MediaType                  : MIMETYPE
        CONTENT  : LargeBinary;

        @Core.IsMediaType                : true
        MIMETYPE : String;

        @Core.ContentDisposition.Filename: FILENAME
        FILENAME : String
}
