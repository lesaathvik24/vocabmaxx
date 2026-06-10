const USER_MESSAGES: Record<string, string> = {
    not_found: 'No definition found for that word.',
    no_fallback_available: 'Definition lookup is unavailable right now.',
    malformed_llm_response: 'Received an unexpected response. Please try again.',
    network_failure: 'A network error occurred. Check your connection.',
    rate_limited: 'Too many requests. Please wait a moment.',
    duplicate_term: 'You already have that word in your collection.',
    invalid_term: 'Please enter a valid English word (letters only).',
    word_not_found: 'Word not found in your collection.',
    not_due: 'This word is not due for review yet.',
    invalid_input: 'Invalid input. Please check your request and try again.',
}

export function toUserMessage(kind: string): string {
    return USER_MESSAGES[kind] ?? 'Something went wrong. Please try again.'
}
