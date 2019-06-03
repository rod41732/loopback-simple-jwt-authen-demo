# rnkm-registration

[![LoopBack](https://github.com/strongloop/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png)](http://loopback.io/)

Explanation 
## services
 - UserService is for logging in (verify `Credentials` username/password), and convertToUserProfile
 - JWTService is for generating/verifying tokens
 
## keys.ts
 this file is for Bindings. provide "Global" access to TokenService, UserService
 
## Controller
 - UserController: simple controller with  
   - post /users: to create user -> generated by `$ lb4 controller`
   - post /users/login: to login and get token `copied from shopping-example`
    - uses `UserService`: for querying user and `JWTService` for creating token
   - get /users/me: to get current user based on token in `Authorization` header `copied from shopping-example`
    - uses `JWTService` to verify token return an `UserProfile` which is then accessed using `@inject(AuthenticationBindings.CURRENT_USER)`
 ## What to modify
  - Modify `application.ts`
   - setUpBindings(): to set up bindings in `keys.ts`
   - add line 30:31 to register Authentication strategy 
  - Modify `sequence.ts`
   - inject `AuthenticationBindings.AUTH_ACTION` and use it to authenticate
   
