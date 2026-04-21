import puppeteer from 'puppeteer';
import path from 'path';

export async function convertHtmlToPdf(htmlFilePath: string, outputPdfPath: string) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ...(process.env.PUPPETEER_EXECUTABLE_PATH ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH } : {})
    });
    
    const page = await browser.newPage();
    
    // Using file:// URL to properly load local resources if needed
    await page.goto(`file://${path.resolve(htmlFilePath)}`, { waitUntil: 'networkidle0' });
    
    await page.pdf({
        path: outputPdfPath,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }
    });
    
    await browser.close();
}
