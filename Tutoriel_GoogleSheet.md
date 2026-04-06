# Guide : Lier la base de données Google Sheet au Site Web

Pour pouvoir gérer la liste des membres, afficher `Payé/Non Payé` en direct de façon dynamique, et enregistrer les historiques directement dans une base de données, l'une des meilleures solutions "simples et sans serveur backend" est d'utiliser un **Google Sheet**.

Voici les étapes pas-à-pas pour rendre votre fichier Excel Google disponible à votre site internet.

## Étape 1 : Créer le fichier Google Sheet
1. Allez sur votre Google Drive et créez un nouveau fichier **Google Sheets**.
2. Nommez le fichier comme vous voulez (ex: *Base Cotisation*).
3. À la première ligne (A1, B1, C1...), ajoutez ces titres exactement comme ceci :
   - Colonne A : `Nom`
   - Colonne B : `Telephone`
   - Colonne C : `Paye` (Mettre *Oui* ou *Non*)
   - Colonne D : `DatePaiement` (Laissé vide)

Remplissez les colonnes A, B et C en dessous avec votre liste de membres familiaux.

## Étape 2 : Créer le lien avec le Formulaire (Apps Script)
1. Toujours dans votre Google Sheet, cliquez en haut sur **Extensions > Apps Script**.
2. Un nouvel onglet de code s'ouvre. Effacez tout le code présent.
3. Copiez et collez le code suivant à la place :

```javascript
var SHEET_NAME = 'Feuille 1'; // Si le nom de la feuille est différent, changez-le

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var users = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var user = {};
    for (var j = 0; j < headers.length; j++) {
      user[headers[j]] = row[j];
    }
    // Formater la réponse pour la rendre compréhensible par notre script.js
    users.push({
      name: user.Nom,
      phone: user.Telephone,
      paid: user.Paye
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify(users)).setMimeType(ContentService.MimeType.JSON);
}

// Optionnel: Cette partie va enregistrer l'intention de paiement quand l'utilisateur clique sur PAYER
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    var postData = JSON.parse(e.postData.contents);
    
    // On ajoute une ligne temporaire ou un log pour dire "Quelqu'un tente de payer" en bas de liste
    sheet.appendRow([postData.name + " (En Attente)", postData.phone, "Non", postData.date]);
    
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput("Error").setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Étape 3 : Déployer et obtenir l'URL Web
1. Cliquez sur le bouton bleu **Déployer > Nouvelle URL de déploiement (Nouveau Déploiement)** en haut à droite.
2. Pour *Type*, sélectionnez l'icone de l'engrenage / Roue dentée, puis cliquez sur **Application Web**.
3. Remplissez les champs :
   - *Description* : API Cotisation
   - *Exécuter en tant que* : **Moi (Votre adresse mail)**
   - *Qui a accès* : **Tout le monde** (Important pour que le site web puisse lire la liste).
4. Cliquez sur **Déployer**. *(Google peut vous demander de vérifier les autorisations d'accès, acceptez et cliquez sur "Paramètres avancés" et "Aller à Projet (dangereux)").*
5. Copiez **l'URL de l'application Web** qui commence par `https://script.google.com/macros/s/..../...`

## Étape 4 : Lier au site internet
1. Ouvrez votre fichier `script.js` dans vos documents du Site.
2. À la ligne 2, trouvez la variable `const GOOGLE_SCRIPT_URL = "VOTRE_URL_GOOGLE_APPS_SCRIPT_ICI";`
3. Remplacez `"VOTRE_URL_GOOGLE_APPS_SCRIPT_ICI"` par le grand lien que vous avez copié de Google Script.
4. Enregistrez, et voilà !

Maintenant, dès que vous changerez *"Non"* par *"Oui"* dans votre tableur Excel Google côté "Paye", la personne passera instantanément dans la catégorie "A Jour" en vert sur votre site !
