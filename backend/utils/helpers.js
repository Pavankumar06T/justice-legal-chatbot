// Format legal resources into a structured response
export function formatLegalResources(resources) {
  if (!resources) return null;

  if (typeof resources === 'string') {
    return { summary: resources };
  }

  // If it's already an object, return as is
  return resources;
}

// Validate email format for future notification features
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitize user input to prevent injection attacks
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  return input
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/'/g, '&#x27;')
    .replace(/"/g, '"')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#96;');
}

// Generate a summary of chat history
export function generateChatSummary(history) {
  if (!history || history.length === 0) return 'No conversation history';

  const userMessages = history
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content)
    .join(', ');

  return `The user asked about: ${userMessages.substring(0, 200)}${userMessages.length > 200 ? '...' : ''}`;
}
