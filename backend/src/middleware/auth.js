import { verifyToken } from '../utils/token.js'

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const token = authHeader.split(' ')[1]
    const user = verifyToken(token)
    req.user = user
    return next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}





