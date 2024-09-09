const axios = require('axios');

/**
 * Function to download a PDF and convert it to a Base64 string
 * @param {string} pdfUrl - The URL of the hosted PDF
 * @returns {Promise<string>} - A promise that resolves to the Base64-encoded PDF string
 */
const pdfToBase64 = async (pdfUrl) => {
  try {
    const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
    const pdfBase64 = Buffer.from(response.data).toString('base64');
    return pdfBase64;
  } catch (error) {
    console.error('Error converting PDF to Base64:', error);
    throw error;
  }
};

module.exports = pdfToBase64;
