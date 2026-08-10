// Script de test d'injection pour ChatGPT
// Copiez-collez ce code dans la console de ChatGPT (F12)

(function() {
  console.log("🧪 AI Session Live - Test d'injection");
  
  // Trouver le composer
  const selectors = [
    '#prompt-textarea',
    'div[contenteditable="true"][role="textbox"]',
    'div[contenteditable="true"]',
    'textarea'
  ];

  let foundElement = null;
  let foundSelector = null;

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      foundElement = element;
      foundSelector = selector;
      console.log("✅ Composer trouvé avec:", selector, element);
      break;
    }
  }

  if (!foundElement) {
    console.error("❌ Aucun composer trouvé");
    return;
  }

  // Tester l'injection
  const testText = "TEST MULTIPLAYER";
  console.log("📝 Injection de:", testText);

  try {
    if (foundElement instanceof HTMLTextAreaElement) {
      foundElement.value = testText;
      foundElement.dispatchEvent(new Event('input', { bubbles: true }));
      console.log("✅ Injection textarea réussie");
    } else {
      // ContentEditable
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(foundElement);
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      const inserted = document.execCommand('insertText', false, testText);
      if (inserted) {
        console.log("✅ Injection execCommand réussie");
      } else {
        foundElement.textContent = testText;
        console.log("✅ Injection textContent réussie");
      }
    }

    console.log("🎉 Test terminé - vérifiez si le texte apparaît dans ChatGPT");
    
    // Vérifier le contenu
    setTimeout(() => {
      console.log("📋 Contenu actuel:", foundElement.innerText || foundElement.value);
    }, 100);

  } catch (error) {
    console.error("❌ Erreur:", error);
  }
})();