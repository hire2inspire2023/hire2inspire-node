const path = require('path');
const ejs = require('ejs');
const puppeteer = require('puppeteer');


module.exports = {
  termsAndCondition: async (req, res, next) => {
    try {
      const termsAndCondition = path.join(__dirname, '../templates', 'termsAndCondition.ejs');
      const privatePolicy = path.join(__dirname, '../templates', 'privatePolicy.ejs');
      const refundPolicy = path.join(__dirname, '../templates', 'refund.ejs');
      const type = req.query.type
      let templatePath = ""
      if (type == "terms") {
        templatePath = termsAndCondition
      }

      if (type == "privacy") {
        templatePath = privatePolicy
      }

      if (type == "refund") {
        templatePath = refundPolicy
      }

      if (!templatePath) {
        return res
          .status(400)
          .send({ error: true, message: "Template Not Found" });
      }

      const htmlContent = await ejs.renderFile(templatePath, {
        title: "Sample PDF Report",
        date: new Date().toLocaleString(),
        name: "John Doe",
      });

      // 2. Launch puppeteer and create PDF
      console.log("herere")
      const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });   
      console.log(browser,"browser---------") 
      const page = await browser.newPage();
      console.log(page,"page---------------")
      // await page.setContent(htmlContent, { waitUntil: "load" });
      const setContent = await page.setContent(htmlContent, { waitUntil: "networkidle2", timeout: 60000 });
      console.log(setContent,"setContent----------")

      const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

      console.log('PDF Buffer Length:', pdfBuffer.length);

      await browser.close();

      // 3. Send the generated PDF file to the client
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="Report.pdf"');
      res.end(pdfBuffer);
    } catch (error) {
      res.status(500).send("Error generating PDF");
      console.error(error);
    }
  },
};
