// Content moderation utilities

// List of inappropriate words (basic example - in production, use a comprehensive list or API)
const INAPPROPRIATE_WORDS = [
  // Spam/Test words
  'spam', 'scam', 'fake', 'test123', 'asdf', 'qwerty',
  
  // Profanity - English
  'fuck', 'fucking', 'fucked', 'shit', 'shitting', 'damn', 'damned',
  'bitch', 'bitches', 'ass', 'asshole', 'bastard', 'crap', 'cunt',
  'dick', 'dicks', 'pussy', 'cock', 'whore', 'slut', 'nigger', 'nigga',
  'retard', 'retarded', 'gay', 'fag', 'faggot', 'homo', 'lesbo',
  
  // Profanity - Thai (transliterated)
  'ai', 'ee', 'khee', 'khi', 'kwai', 'kwaii', 'sii', 'see',
  'mae', 'mee', 'mhee', 'pii', 'pee', 'peepee', 'piss',
  
  // Sexual content
  'sex', 'sexual', 'porn', 'porno', 'pornography', 'xxx', 'nude', 'naked',
  'orgasm', 'masturbate', 'masturbation', 'penis', 'vagina', 'boob', 'boobs',
  'breast', 'breasts', 'nipple', 'nipples', 'erotic', 'erotica',
  
  // Violence/Threats
  'kill', 'killing', 'murder', 'murderer', 'suicide', 'bomb', 'terrorist',
  'terrorism', 'violence', 'violent', 'weapon', 'gun', 'knife', 'shoot',
  'shooting', 'rape', 'raping', 'abuse', 'abusing',
  
  // Drugs/Illegal substances
  'drug', 'drugs', 'cocaine', 'heroin', 'marijuana', 'weed', 'cannabis',
  'meth', 'methamphetamine', 'lsd', 'ecstasy', 'mdma', 'opium',
  
  // Hate speech
  'hate', 'hatred', 'racist', 'racism', 'nazi', 'hitler', 'holocaust',
  'genocide', 'ethnic', 'cleansing',
  
  // Scam/Fraud related
  'phishing', 'phish', 'fraud', 'fraudulent', 'steal', 'stealing', 'theft',
  'hack', 'hacking', 'hacker', 'virus', 'malware', 'trojan',
  
  // Other inappropriate
  'stupid', 'idiot', 'moron', 'dumb', 'dumbass', 'loser', 'pathetic'
]

// Check for spam patterns
export const detectSpam = (text) => {
  if (!text) return { isSpam: false, reason: null }
  
  // Trim whitespace
  const trimmedText = text.trim()
  if (trimmedText.length < 3) {
    return { isSpam: false, reason: null } // Too short to be spam
  }
  
  const lowerText = trimmedText.toLowerCase()
  
  // Check for inappropriate words
  // Use word boundary regex to match whole words only (avoid false positives)
  for (const word of INAPPROPRIATE_WORDS) {
    // Create regex pattern that matches the word as a whole word
    // \b is word boundary, but we also check for spaces, punctuation, or start/end
    const wordPattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (wordPattern.test(lowerText)) {
      return { isSpam: true, reason: 'Contains inappropriate content' }
    }
    // Also check if the word appears at the start or end of the text
    if (lowerText.startsWith(word + ' ') || lowerText.endsWith(' ' + word) || lowerText === word) {
      return { isSpam: true, reason: 'Contains inappropriate content' }
    }
  }
  
  // Check for excessive repetition of same character (e.g., "aaaaaa", "111111")
  // Only check if text is longer than 10 characters
  if (trimmedText.length > 10 && /(.)\1{5,}/.test(trimmedText)) {
    return { isSpam: true, reason: 'Contains excessive character repetition' }
  }
  
  // Check for excessive special characters (excluding spaces and common punctuation)
  // Only check if text is longer than 20 characters
  if (trimmedText.length > 20) {
    const specialChars = trimmedText.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/g) || []
    const specialCharRatio = specialChars.length / trimmedText.length
    // Allow up to 20% special characters for normal text
    if (specialCharRatio > 0.2) {
      return { isSpam: true, reason: 'Contains excessive special characters' }
    }
  }
  
  // Check for all caps (shouting) - only for English text
  // Skip this check for Thai text (which doesn't have case)
  if (trimmedText.length > 10 && /[A-Z]/.test(trimmedText) && !/[\u0E00-\u0E7F]/.test(trimmedText)) {
    const upperCaseRatio = (trimmedText.match(/[A-Z]/g) || []).length / trimmedText.length
    // If more than 80% are uppercase and it's all uppercase, consider it spam
    if (upperCaseRatio > 0.8 && trimmedText === trimmedText.toUpperCase()) {
      return { isSpam: true, reason: 'Excessive use of capital letters' }
    }
  }
  
  return { isSpam: false, reason: null }
}

// Validate image URL/Base64
export const validateImage = (imageUrl) => {
  if (!imageUrl) return { isValid: true } // Image is optional
  
  // Check if it's a base64 image
  if (imageUrl.startsWith('data:image/')) {
    const base64Data = imageUrl.split(',')[1]
    if (!base64Data) {
      return { isValid: false, reason: 'Invalid base64 image format' }
    }
    
    // Check size (max 5MB for base64)
    const sizeInBytes = (base64Data.length * 3) / 4
    const maxSize = 5 * 1024 * 1024 // 5MB
    
    if (sizeInBytes > maxSize) {
      return { isValid: false, reason: 'Image size exceeds 5MB limit' }
    }
    
    // Check image type
    const imageType = imageUrl.match(/data:image\/(\w+);base64/)?.[1]
    const allowedTypes = ['jpeg', 'jpg', 'png', 'webp', 'gif']
    
    if (!imageType || !allowedTypes.includes(imageType.toLowerCase())) {
      return { isValid: false, reason: 'Invalid image type. Only JPEG, PNG, WebP, and GIF are allowed' }
    }
  } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // URL validation - basic check
    try {
      new URL(imageUrl)
    } catch {
      return { isValid: false, reason: 'Invalid image URL format' }
    }
  } else {
    return { isValid: false, reason: 'Invalid image format' }
  }
  
  return { isValid: true }
}

// Check for duplicate content
export const checkDuplicateContent = async (query, userId, title, description) => {
  try {
    // Check for similar titles from the same user in the last 24 hours
    const result = await query(
      `SELECT id, title, created_at 
       FROM items 
       WHERE user_id = $1 
         AND LOWER(title) = LOWER($2)
         AND created_at > NOW() - INTERVAL '24 hours'
       LIMIT 1`,
      [userId, title]
    )
    
    if (result.rowCount > 0) {
      return { isDuplicate: true, reason: 'You have already posted an item with the same title recently' }
    }
    
    // Check for very similar descriptions (simple check)
    if (description && description.length > 20) {
      const similarResult = await query(
        `SELECT id, title 
         FROM items 
         WHERE user_id = $1 
           AND description IS NOT NULL
           AND LENGTH(description) > 20
           AND created_at > NOW() - INTERVAL '1 hour'
           AND description = $2
         LIMIT 1`,
        [userId, description]
      )
      
      if (similarResult.rowCount > 0) {
        return { isDuplicate: true, reason: 'You have already posted a similar item recently' }
      }
    }
    
    return { isDuplicate: false }
  } catch (err) {
    console.error('Error checking duplicate content:', err)
    // Don't block on error, just log it
    return { isDuplicate: false }
  }
}

