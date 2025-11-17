// Simple in-memory rate limiter
// For production, consider using Redis-based rate limiter

const rateLimitMap = new Map()

export const createRateLimiter = (maxRequests, windowMs) => {
  return (req, res, next) => {
    const userId = req.user?.id || req.ip
    const key = `${userId}:${req.path}`
    const now = Date.now()
    
    const userLimit = rateLimitMap.get(key)
    
    if (!userLimit) {
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return next()
    }
    
    // Reset if window expired
    if (now > userLimit.resetTime) {
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return next()
    }
    
    // Check if limit exceeded
    if (userLimit.count >= maxRequests) {
      const remainingTime = Math.ceil((userLimit.resetTime - now) / 1000)
      return res.status(429).json({
        message: `Too many requests. Please try again in ${remainingTime} seconds.`,
        retryAfter: remainingTime
      })
    }
    
    // Increment count
    userLimit.count++
    rateLimitMap.set(key, userLimit)
    
    next()
  }
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 60000) // Clean up every minute

