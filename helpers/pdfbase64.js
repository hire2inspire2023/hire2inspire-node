const fetch = require('node-fetch');

/**
 * Converts a PDF file from a URL to a Base64-encoded string with retry logic.
 * @param {string} fileUrl - The URL of the PDF file to fetch.
 * @param {number} [retries=3] - Number of retry attempts.
 * @param {number} [delay=1000] - Delay between retries in milliseconds.
 * @returns {Promise<string>} - A promise that resolves to the Base64-encoded PDF string.
 */
async function pdfToBase64(fileUrl, retries = 3, delay = 1000) {
  let attempt = 0;

  while (attempt < retries) {
    try {
      // Fetch the PDF file from the URL
      const response = await fetch(fileUrl);
      
      // Ensure the response is OK (status code 200-299) and is of PDF type
      if (!response.ok) {
        throw new Error(`Failed to fetch the file: ${response.statusText}`);
      }

      const contentType = response.headers.get('Content-Type');
      if (contentType !== 'application/pdf') {
        throw new Error('The fetched file is not a PDF');
      }

      // Get the file as a buffer
      const fileBuffer = await response.buffer();
      
      // Convert the buffer to a Base64 string
      const base64File = fileBuffer.toString('base64');
      
      return base64File;
    } catch (error) {
      attempt += 1;
      console.error(`Attempt ${attempt} failed: ${error.message}`);
      if (attempt >= retries) {
        throw error; // Re-throw the error if all attempts fail
      }
      await new Promise(resolve => setTimeout(resolve, delay)); // Wait before retrying
    }
  }
}

module.exports = pdfToBase64;
