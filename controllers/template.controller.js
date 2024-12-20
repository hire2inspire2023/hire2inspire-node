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
      });

      // 2. Launch puppeteer and create PDF
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disabled-setupid-sandbox"]
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent);
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
