import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getFilterSchemaFor,
  getWhereSchemaFor,
  patch,
  put,
  del,
  requestBody,
} from '@loopback/rest';
import { User } from '../models';
import { UserRepository, Credentials } from '../repositories';
import { authenticate, AuthenticationBindings, UserProfile, UserService, TokenService } from '@loopback/authentication';
import { inject } from '@loopback/context';
import { UserServiceBindings, TokenServiceBindings } from '../keys';

// too lazy to create user-controller-spec
const UserProfileSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    name: { type: 'string' },
  },
};
const CredentialsSchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLength: 8,
    },
  },
};
// ---

export const CredentialsRequestBody = {
  description: 'The input of login function',
  required: true,
  content: {
    'application/json': { schema: CredentialsSchema },
  },
};


export class UserControllerController {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    // for logging in
    @inject(UserServiceBindings.USER_SERVICE)
    protected userService: UserService<User, Credentials>,
    // for generate token
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    protected tokenService: TokenService,
  ) { }

  @post('/users', {
    responses: {
      '200': {
        description: 'User model instance',
        content: { 'application/json': { schema: { 'x-ts-type': User } } },
      },
    },
  })
  async create(@requestBody() user: User): Promise<User> {
    return await this.userRepository.create(user);
  }

  @authenticate('jwt', {
    responses: {
      '200': {
        description: 'The current user profile',
        content: {
          'application/json': {
            schema: UserProfileSchema,
          },
        },
      },
    },
  })
  @get('/users/me')
  async getCurrentUser(
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
  ): Promise<UserProfile> {
    return currentUser;
  }

  @post('/users/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody(CredentialsRequestBody) credentials: Credentials,
  ): Promise<{ token: string }> {
    const user = await this.userService.verifyCredentials(credentials);

    const userProfile = await this.userService.convertToUserProfile(user);

    const token = await this.tokenService.generateToken(userProfile);

    return { token };
  }

}
