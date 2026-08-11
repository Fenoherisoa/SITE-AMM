import React from 'react';

export const AproposPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>À propos d'AMM Connect</h2>
        <div style={styles.divider}></div>
        
        <div style={styles.versionBadge}>Version 3.1.0</div>
        
        <p style={styles.text}>
          <strong>AMM RH</strong> est une solution de gestion des ressources humaines 
          développée pour optimiser et simplifier le suivi administratif et opérationnel 
          au sein de notre organisation.
        </p>

        <div style={styles.infoBox}>
          <p><strong>Développé par :</strong> Équipe Informatique AMM</p>
          <p><strong>Dernière mise à jour :</strong> Juillet 2026</p>
          <p><strong>Licence :</strong> Interne - Propriété AMM</p>
        </div>

        <p style={styles.footerText}>
          Merci d'utiliser AMM Connect pour garantir l'excellence dans notre gestion quotidienne.
        </p>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    background: '#ffffff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
  },
  title: {
    color: '#2c3e50',
    marginBottom: '10px',
  },
  divider: {
    height: '3px',
    width: '50px',
    background: '#3498db',
    margin: '0 auto 20px auto',
    borderRadius: '2px',
  },
  versionBadge: {
    display: 'inline-block',
    background: '#e8f6fd',
    color: '#3498db',
    padding: '5px 15px',
    borderRadius: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  text: {
    color: '#555',
    lineHeight: '1.6',
    marginBottom: '25px',
  },
  infoBox: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'left',
    fontSize: '0.9em',
    color: '#666',
  },
  footerText: {
    marginTop: '30px',
    fontSize: '0.85em',
    color: '#999',
    fontStyle: 'italic',
  }
};