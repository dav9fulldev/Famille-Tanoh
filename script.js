// ⚠️ Mettez ici l'URL de votre web app Google Apps Script une fois déployée
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby-vxRB5RfTUqRwiA-OYe3RKhtyAFonPuq2FKhSCVERlUIUXXsI6pwxM-OaGNEVCtj1Hg/exec";

// Nous avons retiré les fausses données ! Le site attend désormais uniquement le Google Sheet.

document.addEventListener('DOMContentLoaded', () => {
    // 1. Charger et afficher les membres depuis Google Sheet
    loadMembersData();

    // 2. Gestion de l'action Paiement
    const paymentForm = document.getElementById('paymentForm');
    const paymentButton = paymentForm.querySelector('.btn-wave');
    const confirmationMessage = document.getElementById('confirmationMessage');
    const waveLink = "https://pay.wave.com/m/M_ci_t1Z2D2ORrYwh/c/ci/?amount=10000";

    paymentForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('fullName').value;
        const phone = document.getElementById('phone').value || "Non renseigné";
        if (!name) return;

        // Préparer les données pour le reçu à imprimer
        const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        document.getElementById('receiptName').textContent = name;
        document.getElementById('receiptPhone').textContent = phone;
        document.getElementById('receiptDate').textContent = today;

        // Feedback visuel du bouton
        paymentButton.innerHTML = '<ion-icon name="sync-outline" class="spin"></ion-icon> Traitement...';
        paymentButton.disabled = true;

        // Envoi au Google Sheet de l'intention de paiement (si l'URL est configurée)
        let isGoogleUrl = false;
        try {
            const urlObj = new URL(GOOGLE_SCRIPT_URL);
            if (urlObj.hostname === 'script.google.com') {
                isGoogleUrl = true;
            }
        } catch(e) {}

        if (GOOGLE_SCRIPT_URL && isGoogleUrl) {
            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Évite les problèmes de sécurité CORS avec Google
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, phone: phone, date: today })
            }).catch(err => console.error("Erreur sheet", err));
        }

        // Simuler le délai, afficher confirmation, et ouvrir Wave
        setTimeout(() => {
            window.open(waveLink, "_blank");
            paymentButton.style.display = 'none';
            confirmationMessage.style.display = 'block';
        }, 1200);
    });
});

async function loadMembersData() {
    const tbody = document.getElementById('membersList');

    let isGoogleUrl = false;
    try {
        const urlObj = new URL(GOOGLE_SCRIPT_URL);
        if (urlObj.hostname === 'script.google.com') {
            isGoogleUrl = true;
        }
    } catch(e) {}

    if (GOOGLE_SCRIPT_URL && isGoogleUrl) {
        try {
            const response = await fetch(GOOGLE_SCRIPT_URL);
            const data = await response.json();

            if (data && data.length > 0) {
                renderTable(data);
            } else {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #ef4444;">Fichier Excel trouvé mais contenant 0 membre, ou erreur de format de colonnes.</td></tr>';
            }
        } catch (error) {
            console.error("Erreur de synchronisation Google Sheet :", error);
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #ef4444;"><ion-icon name="warning"></ion-icon> Impossible de charger les données : Veuillez vérifier que vous avez bien sélectionné "Tout le monde" lors du déploiement de l\'API.</td></tr>';
        }
    } else {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Veuillez renseigner votre URL Google Script dans le fichier script.js</td></tr>';
    }
}

function renderTable(dataArray) {
    const tbody = document.getElementById('membersList');
    tbody.innerHTML = '';
    let paidCount = 0;

    dataArray.forEach(member => {
        // Vérifie les différents statuts possibles tapés dans la case excel ("Oui", "Payé", "Paye", etc)
        const valPaye = String(member.paid).trim().toLowerCase();
        const isPaid = valPaye === "true" || valPaye === "oui" || valPaye === "payé" || valPaye === "paye";
        if (isPaid) paidCount++;

        const tr = document.createElement('tr');
        const statusClass = isPaid ? 'status-paid' : 'status-unpaid';
        const statusText = isPaid ? 'Payé' : 'Non payé';
        
        let printBtnContent = "";
        if (isPaid) {
            // Un petit bouton pour imprimer le reçu plus tard !
            const safeName = (member.name || member.Nom || "Membre").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
            const safePhone = (member.phone || member.Telephone || "-").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
            printBtnContent = `<button class="btn-print-small" onclick="imprimerRecu('${safeName}', '${safePhone}')" title="Imprimer le Reçu"><ion-icon name="print"></ion-icon></button>`;
        }

        tr.innerHTML = `
            <td><strong>${member.name || member.Nom}</strong></td>
            <td>${member.phone || member.Telephone || "-"}</td>
            <td>
                <div style="display:flex; align-items:center; gap: 10px;">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    ${printBtnContent}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Stats
    document.getElementById('totalMembers').textContent = dataArray.length;
    document.getElementById('paidMembers').textContent = paidCount;
    document.getElementById('unpaidMembers').textContent = dataArray.length - paidCount;
}

// Fonction globale pour pouvoir imprimer le reçu depuis le tableau plus tard
window.imprimerRecu = function(name, phone) {
    const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    document.getElementById('receiptName').textContent = name;
    document.getElementById('receiptPhone').textContent = phone;
    document.getElementById('receiptDate').textContent = today;
    window.print();
};
