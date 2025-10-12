import React from "react";

const ResourceModal = ({ resourceType, onClose }) => {
  if (!resourceType) return null;

  const handleDownloadRights = () => {
    window.open("https://travel.state.gov/content/dam/visas/LegalRightsandProtections/Wilberforce/Documents/Wilberforce%20Pamphlet%20ENGLISH.pdf", "_blank");
  };

  const handleExternalLink = (url) => {
    window.open(url, "_blank");
  };

  const renderContent = () => {
    switch(resourceType) {
      case 'legal-forms':
        return (
          <div className="resource-content">
            <h3>Legal Forms</h3>
            <p>Access commonly used legal forms and templates:</p>
            <div className="resource-categories">
              <div className="resource-category">
                <h4>📝 Civil Forms</h4>
                <ul>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.uscourts.gov/forms/pro-se-forms")}>Small Claims Court Forms</button></li>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.courts.ca.gov/documents/pb-100.pdf")}>Name Change Petition</button></li>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://ag.ca.gov/consumers/pdf/PowerofAttorney.pdf")}>Power of Attorney</button></li>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.hud.gov/sites/documents/DOC_12350.PDF")}>Landlord-Tenant Agreements</button></li>
                </ul>
              </div>
              <div className="resource-category">
                <h4>🏠 Property Forms</h4>
                <ul>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.zillow.com/rental-manager/resources/rental-application/")}>Rental Agreement Templates</button></li>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.lawdepot.com/contracts/lease-agreement/")}>Lease Agreement</button></li>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.rocketlawyer.com/business-and-contracts/real-estate/sales-and-transfers/real-estate-purchase-agreement")}>Property Sale Agreement</button></li>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.nolo.com/legal-encyclopedia/free-books/renters-rights-book/chapter5-2.html")}>Eviction Notice Templates</button></li>
                </ul>
              </div>
              <div className="resource-category">
                <h4>👨‍👩‍👧‍👦 Family Law Forms</h4>
                <ul>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.courts.ca.gov/documents/fl100.pdf")}>Divorce Petition</button></li>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.courts.ca.gov/documents/fl315.pdf")}>Child Custody Agreement</button></li>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.rocketlawyer.com/family-and-personal/marriage/pre-nuptial-agreement")}>Prenuptial Agreement</button></li>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.courts.ca.gov/documents/adopt200.pdf")}>Adoption Papers</button></li>
                </ul>
              </div>
            </div>
            <div className="resource-disclaimer">
              <p><strong>Disclaimer:</strong> These forms are provided for informational purposes only and do not constitute legal advice.</p>
            </div>
          </div>
        );
      
      case 'rights-info':
        return (
          <div className="resource-content">
            <h3>Know Your Rights</h3>
            <p>Understanding your legal rights is essential. Explore these categories:</p>
            <div className="resource-categories">
              <div className="resource-category">
                <h4>📜 Constitutional Rights</h4>
                <ul>
                  <li>Freedom of Speech & Expression</li>
                  <li>Right to Privacy</li>
                  <li>Protection Against Discrimination</li>
                  <li>Right to Due Process</li>
                </ul>
              </div>
              <div className="resource-category">
                <h4>🛒 Consumer Rights</h4>
                <ul>
                  <li>Right to Safety</li>
                  <li>Right to Information</li>
                  <li>Right to Choose</li>
                  <li>Right to Redress</li>
                </ul>
              </div>
              <div className="resource-category">
                <h4>💼 Employment Rights</h4>
                <ul>
                  <li>Right to Fair Wage</li>
                  <li>Workplace Safety</li>
                  <li>Protection Against Harassment</li>
                  <li>Right to Organize</li>
                </ul>
              </div>
            </div>
            <div className="resource-action">
              <button className="resource-primary-btn" onClick={handleDownloadRights}>
                Download Rights Handbook
              </button>
            </div>
          </div>
        );
      
      case 'legal-library':
        return (
          <div className="resource-content">
            <h3>Legal Library</h3>
            <div className="resource-categories">
              <div className="resource-category">
                <h4>📚 Legal References</h4>
                <ul>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.archives.gov/founding-docs/constitution")}>Constitution & Amendments</button></li>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.govinfo.gov/app/collection/uscode")}>Federal Statutes</button></li>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.findlaw.com/state-laws.html")}>State Codes</button></li>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.municode.com/library")}>Local Ordinances</button></li>
                </ul>
              </div>
              <div className="resource-category">
                <h4>⚖️ Case Law</h4>
                <ul>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.supremecourt.gov/opinions/opinions.aspx")}>Supreme Court Decisions</button></li>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.uscourts.gov/records/records-courts-of-appeals")}>Appellate Court Rulings</button></li>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.oyez.org/landmark_cases")}>Landmark Cases</button></li>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.scotusblog.com/")}>Recent Judgments</button></li>
                </ul>
              </div>
              <div className="resource-category">
                <h4>🔍 Legal Research</h4>
                <ul>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://dictionary.law.com/")}>Legal Dictionaries</button></li>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.law.cornell.edu/wex/dictionary")}>Research Guides</button></li>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.law.cornell.edu/citation/")}>Citation Manuals</button></li>
                  <li><button className="form-link" onClick={() => handleExternalLink("https://www.americanbar.org/groups/public_education/resources/law_related_education_network/how_to_research_a_legal_problem/")}>Practice Guides</button></li>
                </ul>
              </div>
            </div>
            <div className="resource-external">
              <h4>External Resources</h4>
              <div className="external-links">
                <button className="form-link" onClick={() => handleExternalLink("https://www.loc.gov/law/help/guide.php")}>Law Library of Congress</button>
                <button className="form-link" onClick={() => handleExternalLink("https://www.law.cornell.edu/")}>Legal Information Institute</button>
                <button className="form-link" onClick={() => handleExternalLink("https://www.ncsc.org/information-and-resources/state-court-websites")}>State Law Libraries</button>
              </div>
            </div>
          </div>
        );
      
      case 'help-faq':
        return (
          <div className="resource-content">
            <h3>Help & Frequently Asked Questions</h3>
            <div className="faq-section">
              <div className="faq-category">
                <h4>❓ Using the Assistant</h4>
                <div className="faq-item">
                  <h5>How does the Justice Assistant work?</h5>
                  <p>The assistant uses AI to provide general legal information based on your questions. It can help you understand legal concepts, procedures, and direct you to appropriate resources and also it can translate the content into multiple language.</p>
                </div>
                <div className="faq-item">
                  <h5>Can the assistant provide legal advice?</h5>
                  <p>No, the assistant cannot provide legal advice or represent you in legal matters. It offers legal information only.</p>
                </div>
              </div>
              
              <div className="faq-category">
                <h4>⚖️ Legal Assistance</h4>
                <div className="faq-item">
                  <h5>How do I find a lawyer?</h5>
                  <p>You can contact your local bar association for lawyer referrals or use legal aid services if you qualify based on income.</p>
                </div>
                <div className="faq-item">
                  <h5>What if I can't afford a lawyer?</h5>
                  <p>Many communities have legal aid organizations that provide free or low-cost services to those who qualify.</p>
                </div>
              </div>
              
              <div className="faq-category">
                <h4>📞 Contact Information</h4>
                <div className="contact-info">
                  <p><strong>Legal Aid Hotline:</strong> 15100 </p>
                  <p><strong>State Bar Association:</strong> 1800 4252 441</p>
                  <p><strong>Emergency Legal Services:</strong> 044-25343363</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="resource-modal-overlay" onClick={onClose}>
      <div className="resource-modal" onClick={e => e.stopPropagation()}>
        <button className="resource-modal-close" onClick={onClose} aria-label="Close modal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {renderContent()}
      </div>
    </div>
  );
};

export default ResourceModal;