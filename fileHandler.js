const fs = require('fs').promises;
const jsonfile = require('jsonfile');
const PDFDocument = require('pdfkit');
const path = require('path');
const { parse } = require('json2csv');

const invoicePath = path.join(__dirname, 'invoices');
const transactionLogPathJson = path.join(__dirname, 'transactions.json');
const transactionLogPathCsv = path.join(__dirname, 'transactions.csv');

// Ensure the invoices directory exists
async function initializeDirectories() {
    try {
        await fs.mkdir(invoicePath, { recursive: true });
    } catch (error) {
        console.error('Error creating directory:', error);
    }
}
initializeDirectories();

const generateInvoice = async (paymentDetails, format = 'pdf') => {
    const timestamp = Date.now();
    if (format === 'pdf') {
        const doc = new PDFDocument();
        const invoiceFile = path.join(invoicePath, `invoice_${timestamp}.pdf`);
        doc.pipe(require('fs').createWriteStream(invoiceFile));

        doc.fontSize(25).text('Invoice', { align: 'center' });
        doc.text(`User: ${paymentDetails.user}`, 100, 100);
        doc.text(`Amount: $${paymentDetails.amount}`, 100, 130);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 100, 160);

        doc.end();
        return invoiceFile;
    } else if (format === 'csv') {
        const invoiceFile = path.join(invoicePath, `invoice_${timestamp}.csv`);
        const csvData = `User,Amount,Date\n${paymentDetails.user},${paymentDetails.amount},${new Date().toLocaleDateString()}\n`;
        await fs.writeFile(invoiceFile, csvData);
        return invoiceFile;
    }
};

const logTransaction = async (transaction, format = 'json') => {
    if (format === 'json') {
        try {
            const data = await jsonfile.readFile(transactionLogPathJson).catch(() => []);
            data.push(transaction);
            await jsonfile.writeFile(transactionLogPathJson, data, { spaces: 2 });
        } catch (error) {
            console.error('Error logging transaction in JSON:', error);
        }
    } else if (format === 'csv') {
        const csvData = `${transaction.user},${transaction.amount},${new Date(transaction.timestamp).toLocaleDateString()}\n`;
        try {
            const exists = await fs.access(transactionLogPathCsv).then(() => true).catch(() => false);
            if (!exists) {
                await fs.writeFile(transactionLogPathCsv, 'User,Amount,Date\n'); // Add headers if file is new
            }
            await fs.appendFile(transactionLogPathCsv, csvData);
        } catch (error) {
            console.error('Error logging transaction in CSV:', error);
        }
    }
};

module.exports = { generateInvoice, logTransaction };
