import nodemailer from 'nodemailer'
import env from '../config/env.js'

const transporter = nodemailer.createTransport({
  host: env.emailHost,
  port: env.emailPort,
  secure: env.emailPort === 465,
  auth: {
    user: env.emailUser,
    pass: env.emailPass,
  },
})

export const sendEmail = async ({ to, subject, html }) => {
  if (!to.endsWith('@cmu.ac.th')) {
    throw new Error('Notifications can only be sent to a cmu.ac.th address')
  }

  await transporter.sendMail({
    from: env.emailFrom,
    to,
    subject,
    html,
  })
}

