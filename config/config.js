const env = process.env.NODE_ENV || "dev";

let config = {
    dev : {
        emailInfoHire2Inspire : 'hire2inspire@yopmail.com',
        fireBaseUrl : 'https://firebasestorage.googleapis.com/v0/b/hire2inspire-62f96.appspot.com/o/'
    } ,
    prod : {
        emailInfoHire2Inspire : 'info@hire2inspire.com',
        fireBaseUrl : 'https://firebasestorage.googleapis.com/v0/b/hire2inspire-62f96.appspot.com/o/'
    }

}

module.exports = config[env]