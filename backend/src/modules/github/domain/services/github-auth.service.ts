import {Injectable, Logger} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {HttpService} from '@nestjs/axios'
import {firstValueFrom} from 'rxjs'
import jwt, {SignOptions} from 'jsonwebtoken'
import {AxiosResponse} from 'axios'
import {GitHubAccessTokenResponse} from '../interfaces/github-access-token-response.interface'
import {GITHUB_API_URL} from '../constants/github.constants'

@Injectable()
export class GithubAuthService {
  private readonly logger = new Logger(GithubAuthService.name)
  private cachedToken: {token: string; expiresAt: number} | null = null

  private readonly APP_ID: string
  private readonly INSTALLATION_ID: string
  private readonly PRIVATE_KEY: string

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.APP_ID = this.configService.get<string>('github.appId')!
    this.INSTALLATION_ID = this.configService.get<string>(
      'github.installationId',
    )!
    this.PRIVATE_KEY = this.configService.get<string>('github.privateKey')!
  }

  public async getInstallationToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.cachedToken!.token
    }

    this.logger.log('Generating new GitHub App installation token...')
    return this.generateNewToken()
  }

  private isTokenValid(): boolean {
    return (
      (this.cachedToken &&
        this.cachedToken.expiresAt > Date.now() + 60 * 1000) ??
      false
    )
  }

  private async generateNewToken(): Promise<string> {
    const appJwt = this.createAppJwt()
    const url = `${GITHUB_API_URL}/app/installations/${this.INSTALLATION_ID}/access_tokens`

    try {
      const response = await firstValueFrom<
        AxiosResponse<GitHubAccessTokenResponse>
      >(
        this.httpService.post<GitHubAccessTokenResponse>(
          url,
          {},
          {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              Authorization: `Bearer ${appJwt}`,
            },
          },
        ),
      )

      const token = response.data.token
      const expiresAt = new Date(response.data.expires_at).getTime()

      this.cachedToken = {token, expiresAt}
      this.logger.log('Successfully generated and cached new token.')

      return token
    } catch (error) {
      this.logger.error(
        'Failed to generate installation token',
        error instanceof Error ? error.stack : error,
      )
      throw new Error('Could not generate GitHub installation token.')
    }
  }

  private createAppJwt(): string {
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iat: now - 60,
      exp: now + 10 * 60,
      iss: this.APP_ID,
    }

    const options: SignOptions = {
      algorithm: 'RS256',
    }

    return jwt.sign(payload, this.PRIVATE_KEY, options)
  }
}
