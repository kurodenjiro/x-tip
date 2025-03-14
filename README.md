# Project Setup

## 1. Create Web3 Client ID and Get Environment Variables

1. Go to the Web3 provider's website and create a new project to get your Client ID.
2. Add the Client ID to your `.env` file as follows:
    ```properties
    REACT_APP_WEB3_CLIENT_ID="your_web3_client_id"
    ```

## 2. Create Firebase Project and Enable Twitter Provider

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project or select an existing project.
3. Navigate to the Authentication section and enable the Twitter provider.
4. Add the Firebase configuration to your [.env](http://_vscodecontentref_/0) file:
    ```properties
    REACT_APP_FIREBASE_API_KEY="your_firebase_api_key"
    REACT_APP_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
    REACT_APP_FIREBASE_PROJECT_ID="your_project_id"
    REACT_APP_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com"
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
    REACT_APP_FIREBASE_APP_ID="your_app_id"
    REACT_APP_FIREBASE_MEASUREMENT_ID="your_measurement_id"
    ```

## 3. Deploy Contract

1. Go to the [contract](http://_vscodecontentref_/1) folder.
2. Deploy the contract using the following command:
    ```sh
    cargo near deploy
    ```
3. Add the contract deployment values to your [.env](http://_vscodecontentref_/2) file:
    ```properties
    REACT_APP_CONTRACT_ID="your_contract_id"
    ```

## Default .env


```properties
REACT_APP_MPC_PUBLIC_KEY="secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3"
REACT_APP_MPC_PATH="bitcoin-drop,1"
```

## 4. Install NPM Packages

1. Run the following command to install the necessary npm packages:
    ```sh
    npm install
    ```

## 5. Start Project

1. Run the following command to start the project:
    ```sh
    npm start
    ```

# 6. Setup Bot

1. Go to the `bot` folder:
    ```sh
    cd bot
    ```
2. Install the necessary npm packages:
    ```sh
    npm install
    ```
3. Get Twitter cookies and set the `.env` in the bot folder:
    - Run the `bot-puppeter.ts` script to log in to Twitter and save cookies.
    - Copy the cookies from the generated `twitter_cookies.txt` file.
    - Paste the cookies into the `TWITTER_COOKIES` field in the `.env` file.
    - Set the following environment variables in the `.env` file:
        ```properties
        TWITTER_USERNAME=your_twitter_username
        TWITTER_PASSWORD=your_twitter_password
        TWITTER_EMAIL=your_twitter_email
        TWITTER_COOKIES=your_twitter_cookies
        API_URL=your_api_url
        ```
4. Start the bot:
    ```sh
    npm start
    ```