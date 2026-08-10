import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    // Lancer Puppeteer
    const browser = await puppeteer.launch({
      headless: false, // Mode non-headless pour que ChatGPT détecte un vrai navigateur
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
      ]
    });

    const page = await browser.newPage();
    
    // Aller sur ChatGPT
    await page.goto('https://chatgpt.com', { waitUntil: 'networkidle2' });
    
    // Attendre que la page soit complètement chargée
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Utiliser page.type() sur le body pour taper directement
    // Cette méthode est plus robuste que de chercher le textarea spécifique
    await page.click('body');
    await page.keyboard.type(message, { delay: 100 });
    
    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Appuyer sur Entrée pour envoyer
    await page.keyboard.press('Enter');
    
    // Fermer le navigateur
    await browser.close();
    
    return NextResponse.json({ success: true, message: "Message envoyé à ChatGPT via Puppeteer" });
    
  } catch (error) {
    console.error("Erreur Puppeteer:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Erreur lors de l'envoi" 
    }, { status: 500 });
  }
}