import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from 'amazon-cognito-identity-js'
import { cognito } from '../config'
import type { User, AuthTokens } from '../types'

// Initialize Cognito User Pool
const userPool = new CognitoUserPool({
  UserPoolId: cognito.userPoolId,
  ClientId: cognito.userPoolClientId,
})

export class AuthService {
  /**
   * Login with email and password
   */
  static async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      })

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      })

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (session: CognitoUserSession) => {
          const idToken = session.getIdToken().getJwtToken()
          const accessToken = session.getAccessToken().getJwtToken()
          const refreshToken = session.getRefreshToken().getToken()

          const user: User = {
            id: session.getIdToken().payload.sub,
            email: session.getIdToken().payload.email,
            username: session.getIdToken().payload['cognito:username'],
          }

          const tokens: AuthTokens = {
            idToken,
            accessToken,
            refreshToken,
          }

          resolve({ user, tokens })
        },
        onFailure: (err) => {
          reject(err)
        },
        newPasswordRequired: () => {
          reject(new Error('New password required. Please contact support.'))
        },
      })
    })
  }

  /**
   * Register a new user
   */
  static async register(email: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email,
        }),
      ]

      userPool.signUp(email, password, attributeList, [], (err, result) => {
        if (err) {
          reject(err)
          return
        }

        if (!result) {
          reject(new Error('Registration failed'))
          return
        }

        resolve()
      })
    })
  }

  /**
   * Confirm registration with verification code
   */
  static async confirmRegistration(email: string, code: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      })

      cognitoUser.confirmRegistration(code, true, (err) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })
  }

  /**
   * Resend verification code
   */
  static async resendConfirmationCode(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      })

      cognitoUser.resendConfirmationCode((err) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })
  }

  /**
   * Logout current user
   */
  static async logout(): Promise<void> {
    const cognitoUser = userPool.getCurrentUser()
    if (cognitoUser) {
      cognitoUser.signOut()
    }
  }

  /**
   * Get current session
   */
  static async getCurrentSession(): Promise<{ user: User; tokens: AuthTokens } | null> {
    return new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser()

      if (!cognitoUser) {
        resolve(null)
        return
      }

      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session || !session.isValid()) {
          resolve(null)
          return
        }

        const idToken = session.getIdToken().getJwtToken()
        const accessToken = session.getAccessToken().getJwtToken()
        const refreshToken = session.getRefreshToken().getToken()

        const user: User = {
          id: session.getIdToken().payload.sub,
          email: session.getIdToken().payload.email,
          username: session.getIdToken().payload['cognito:username'],
        }

        const tokens: AuthTokens = {
          idToken,
          accessToken,
          refreshToken,
        }

        resolve({ user, tokens })
      })
    })
  }

  /**
   * Refresh tokens
   */
  static async refreshSession(): Promise<{ user: User; tokens: AuthTokens } | null> {
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool.getCurrentUser()

      if (!cognitoUser) {
        resolve(null)
        return
      }

      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) {
          reject(err)
          return
        }

        const refreshToken = session.getRefreshToken()

        cognitoUser.refreshSession(refreshToken, (refreshErr, newSession) => {
          if (refreshErr) {
            reject(refreshErr)
            return
          }

          const idToken = newSession.getIdToken().getJwtToken()
          const accessToken = newSession.getAccessToken().getJwtToken()
          const newRefreshToken = newSession.getRefreshToken().getToken()

          const user: User = {
            id: newSession.getIdToken().payload.sub,
            email: newSession.getIdToken().payload.email,
            username: newSession.getIdToken().payload['cognito:username'],
          }

          const tokens: AuthTokens = {
            idToken,
            accessToken,
            refreshToken: newRefreshToken,
          }

          resolve({ user, tokens })
        })
      })
    })
  }

  /**
   * Forgot password - initiate reset
   */
  static async forgotPassword(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      })

      cognitoUser.forgotPassword({
        onSuccess: () => {
          resolve()
        },
        onFailure: (err) => {
          reject(err)
        },
      })
    })
  }

  /**
   * Confirm password reset with code
   */
  static async confirmPassword(email: string, code: string, newPassword: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      })

      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          resolve()
        },
        onFailure: (err) => {
          reject(err)
        },
      })
    })
  }

  /**
   * Get ID token for API requests
   */
  static async getIdToken(): Promise<string | null> {
    const session = await this.getCurrentSession()
    return session?.tokens.idToken || null
  }
}
