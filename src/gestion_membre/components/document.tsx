import { BASE_URL, base64Logo } from '../constants';

const saveDossierToHistory = async (mem: any, _info: any, typeDossier: string): Promise<string> => {
  const numDossier = `AMM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  try {
    await fetch(`${BASE_URL}/dossiers.json`, {
      method: 'POST',
      body: JSON.stringify({
        numero: numDossier,
        type: typeDossier,
        matricule: mem?.matricule || mem?.id || '',
        nom: mem?.anarana || '',
        date_emission: new Date().toISOString()
      })
    });
  } catch (e) {
    console.warn('Could not save dossier to history', e);
  }
  return numDossier;
};

const generateAttestation = (member: any, assoData: any, numDossier: string) => {
  const info = assoData || {};
  const mem = member || {};
  const today = new Date().toLocaleDateString('fr-FR');
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Attestation - ${mem.anarana || 'Membre'}</title>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #0d3373; padding-bottom: 15px; margin-bottom: 25px; }
          .title { font-size: 20px; font-weight: bold; text-transform: uppercase; color: #0d3373; }
          .content { font-size: 14px; line-height: 1.8; margin-top: 30px; }
          .ref { font-size: 12px; color: #64748b; text-align: right; }
          .footer { margin-top: 60px; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="ref">Réf: ${numDossier}</div>
        <div class="header">
          <div class="title">${info.nom_association || 'ASSOCIATION MALAGASY MIRAY'}</div>
          <div>${info.siege_social || ''}</div>
        </div>
        <h2 style="text-align: center; text-decoration: underline;">ATTESTATION D'APPARTENANCE</h2>
        <div class="content">
          <p>Nous soussignés, certifions par la présente que :</p>
          <p><b>Nom & Prénoms :</b> ${mem.anarana || '---'}</p>
          <p><b>Matricule :</b> ${mem.matricule || mem.id || '---'}</p>
          <p><b>CIN :</b> ${mem.cin || '---'}</p>
          <p><b>Projet / Activité :</b> ${mem.tetikasa || '---'}</p>
          <p>Est régulièrement inscrit(e) comme membre de notre organisation associative.</p>
          <p>En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.</p>
        </div>
        <div style="text-align: right; margin-top: 40px;">Fait le ${today}</div>
        <div class="footer">
          <div>Le Membre</div>
          <div>La Direction</div>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export const loadAndGenerateAttestation = async (item: any, typeDossier = 'Attestation') => {
      const memberId = typeof item === 'object' ? (item.id || item.key) : item;
      
      try {
          const [memberRes, assoRes] = await Promise.all([
              fetch(`${BASE_URL}/olona/${memberId}.json`),
              fetch(`${BASE_URL}/parametres.json`)
          ]);

          const mem = await memberRes.json();
          const info = await assoRes.json();

          // 1. Mamorona sy mitahiry ny numero dossier
          const numDossier = await saveDossierToHistory(mem, info, typeDossier);

          // 2. Misafidy ny layout (Fiche vs Attestation)
          if (typeDossier === 'Adhesion') {
              exportFicheBankStyle(mem, info, numDossier);
          } else {
              generateAttestation(mem, info, numDossier);
          }

      } catch (error) {
          console.error("Error:", error);
      }
  };

  const exportFicheBankStyle = (member, assoData, numDossier) => {
    const info = assoData || {};
    const mem = member || {};
    const today = new Date().toLocaleDateString('fr-FR');
    // Ny soratra ho ao anaty QR
    const qrText = `ID:${mem.id || mem.matricule} | NOM:${mem.anarana}`;

    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>AMM CONNECT ERP - ${mem.anarana || 'Fiche Membre'}</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
          <style>
            /* Fanamboarana mba tsy hiseho ny "about:blank" na URL amin'ny pirinty */
            @media print {
                @page { margin: 15mm; }
                body { margin: 0; }
            }
            body { font-family: 'Helvetica', sans-serif; color: #2d3436; margin: 0; padding: 0; }
            .page { border: 2px solid #000; padding: 40px; min-height: 90vh; }
            
            .header-info { display: flex; align-items: center; border-bottom: 2px double #000; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { width: 90px; margin-right: 20px; }
            .asso-info { flex-grow: 1; text-align: center; }
            .asso-name { font-size: 22px; font-weight: bold; text-transform: uppercase; color: #0d3373; }
            .asso-meta { font-size: 11px; color: #555; }
            
            #qrcode { width: 80px; height: 80px; }

            .doc-title { text-align: center; font-size: 18px; font-weight: bold; text-decoration: underline; margin-bottom: 30px; text-transform: uppercase; color: #0d3373; }
            .section-label { font-size: 11px; font-weight: bold; color: #636e72; border-bottom: 1px solid #dfe6e9; margin-bottom: 5px; padding-top: 15px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .value { font-size: 14px; font-weight: 600; padding: 5px 0; }
            .legal-text { font-size: 11px; text-align: justify; background: #fcfcfc; padding: 15px; border: 1px solid #eee; margin-top: 30px; font-style: italic; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; }
            .sign-box { border-top: 1px solid #000; width: 200px; padding-top: 5px; text-align: center; }
            .date-stamp { text-align: right; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header-info">
              <img src="data:image/png;base64,${base64Logo}" class="logo" />
              <div class="asso-info">
                <div class="asso-name">${info.nom_association || 'ASSOCIATION MALAGASY MIRAY'}</div>
                <div class="asso-ideolo">${info.ideologie}</div>
                <div class="asso-meta">
                  Décret N° ${info.decret || '...'} le ${info.date_decret || '...'} <br/> 
                  Siège social: ${info.siege_social || '...'} <br/>
                  ${info.lieu || '...'} <br/>
                  Email: ${info.email || '...'} | Tel: ${info.telephone || '---'}
                </div>
              </div>
              <div id="qrcode"></div>
            </div>

            <div class="doc-title">Certificat d'Adhésion et d'Engagement</div>

            <div style="text-align: right; font-size: 10px; color: #888;">
                Réf Dossier: ${numDossier}
            </div>
            
            <div class="section-label">IDENTIFICATION DU MEMBRE</div>
            <div class="value" style="font-size: 18px; color: #0d3373;">${mem.anarana || '---'} né(é) le ${mem.date_naissance} à ${mem.lieu_naissance}</div>
            
            <div class="grid">
              <div>
                <div class="section-label">MATRICULE / ID</div>
                <div class="value"> ${mem.id} || ${mem.matricule || '---'}</div>
                <div class="section-label">NUMÉRO CIN</div>
                <div class="value"> ${mem.cin} du ${mem.date_delivrance} à ${mem.lieu_delivrance} </div>
              </div>
              <div>
                <div class="section-label">PROJET D'ACTIVITÉ</div>
                <div class="value">${mem.tetikasa || '---'}</div>
                <div class="section-label">DATE D'ADHÉSION</div>
                <div class="value">${today}</div>
              </div>
            </div>

            <div class="section-label">ADRESSE DE RÉSIDENCE</div>
            <div class="value">${mem.fokontany || '---'}, ${mem.commune || '---'}</div>

            <div class="legal-text">
              <b>CLAUSE D'ENGAGEMENT:</b> Je soussigné, déclare adhérer librement à l'<b> ${info.nom_association || 'AMM'}</b>. Par la présente, je certifie avoir pris connaissance des statuts et du règlement intérieur en vigueur. Je m'engage formellement à respecter les directives des organes dirigeants, à participer activement à la vie associative, et à honorer mes obligations relatives au projet <b>${mem.tetikasa || 'en cours'}</b>.
            </div>

            <div class="date-stamp">Fait à Ambatondrazaka, le ${today}</div>

            <div class="footer">
              <div class="sign-box">Signature de l'adhérent</div>
              <div class="sign-box">Visa de la Présidence</div>
            </div>
          </div>

          <script>
            new QRCode(document.getElementById("qrcode"), {
                text: "${qrText}",
                width: 80,
                height: 80,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });

            window.onload = function() {
                setTimeout(function() {
                    window.print();
                    window.close();
                }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
};