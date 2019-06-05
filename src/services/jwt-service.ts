// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/authentication
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { inject } from '@loopback/context';
import { Filter } from '@loopback/repository';
import { User } from '../models/user.model';
import { HttpErrors } from '@loopback/rest';
import { promisify } from 'util';
import { TokenService, UserProfile } from '@loopback/authentication';
import { TokenServiceBindings, UserServiceBindings } from '../keys';
import { MyUserService } from './user.service';
import { repository, FilterBuilder } from '@loopback/repository';
import { UserRepository } from '../repositories';

const jwt = require('jsonwebtoken');
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

export class JWTService implements TokenService {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SECRET)
    private jwtSecret: string,
    @inject(TokenServiceBindings.TOKEN_EXPIRES_IN)
    private jwtExpiresIn: string,
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) { }

  async verifyToken(token: string): Promise<UserProfile> {
    if (!token) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : 'token' is null`,
      );
    }

    let userProfile: UserProfile;

    try {
      // decode user profile from token

      const decryptedToken = await verifyAsync(token, this.jwtSecret);
      const filter = {
        where: {
          id: decryptedToken.id,
        },
      }
      const matchUser = await this.userRepository.find(filter)
      if (matchUser.length == 0)
        throw new HttpErrors.Unauthorized("Invalid token, User is deleted")
      if (matchUser.length == 1)
        if (matchUser[0].currentToken != token)
          throw new HttpErrors.Unauthorized("Token is Expired or Invalidated")
      // don't copy over  token field 'iat' and 'exp', nor 'email' to user profile
      userProfile = Object.assign(
        { id: '', name: '' },
        { id: decryptedToken.id, name: decryptedToken.name },
      );
    } catch (error) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : ${error.message}`,
      );
    }

    return userProfile;
  }

  async generateToken(userProfile: UserProfile): Promise<string> {
    if (!userProfile) {
      throw new HttpErrors.Unauthorized(
        'Error generating token : userProfile is null',
      );
    }

    // Generate a JSON Web Token
    let token: string;
    try {
      token = await signAsync(userProfile, this.jwtSecret, {
        expiresIn: Number(this.jwtExpiresIn),
      });
      await this.userRepository.updateById(userProfile.id, {
        currentToken: token,
      });

    } catch (error) {
      throw new HttpErrors.Unauthorized(`Error encoding token : ${error}`);
    }

    return token;
  }
}
