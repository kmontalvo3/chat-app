# Vue 3 - Realtime Chat App - First developed by [codingwithjustin](https://github.com/codingwithjustin/vue-realtime-chat)

## Project setup
Make sure you have node and npm installed. You can install both [here](https://nodejs.org/en/download/). Download the LTS version because it will be the most stable
```
npm install
```
This will install all the node modules needed for development. 

If you try to skip to the next step, it probably won't work because there is an issue that happens with tailwind and the post processing of css. The issue can be found [here](https://github.com/forsartis/vue-cli-plugin-tailwind/issues/32)

Luckily, so can the fix:
```
npm install tailwindcss@npm:@tailwindcss/postcss7-compat @tailwindcss/postcss7-compat postcss@^7 autoprefixer@^9
```

And just to be safe, also run the following:
```
npm audit fix
```

This should fix any vulnerabilities with dependencies in the application 
### Compiles and hot-reloads for development
Now you're ready to run the application! The application will be served on your localhost on port 8080 [here](http://localhost:8080/)

```
npm run serve
```
