const env = process.env.NODE_ENV || "dev";

let config = {
    dev : {
        emailInfoHire2Inspire : 'hire2inspire@yopmail.com',
        fireBaseUrl : 'https://firebasestorage.googleapis.com/v0/b/hire2inspire-62f96.appspot.com/o/',
        pythonApi : 'https://resumeatsapi-eafrc4brg2bzfegu.canadacentral-01.azurewebsites.net'
    } ,
    prod : {
        emailInfoHire2Inspire : 'info@hire2inspire.com',
        fireBaseUrl : 'https://firebasestorage.googleapis.com/v0/b/hire2inspire-62f96.appspot.com/o/',
        pythonApi : 'https://resumeatsapi-eafrc4brg2bzfegu.canadacentral-01.azurewebsites.net'
    }

}

module.exports = config[env]