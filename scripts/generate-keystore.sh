#!/bin/bash

# Android Keystore Generation Script
# Usage: ./generate-keystore.sh [alias] [password]
# If arguments are not provided, it will prompt interactively.

set -e

KEYSTORE_DIR="android"
KEYSTORE_FILE="$KEYSTORE_DIR/upload-keystore.jks"
PROPERTIES_FILE="$KEYSTORE_DIR/keystore.properties"

echo "🔐 Android Keystore Generator"
echo "============================="

if [ -f "$KEYSTORE_FILE" ]; then
    echo "⚠️  Keystore already exists at $KEYSTORE_FILE"
    read -p "Do you want to overwrite it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting without changes."
        exit 0
    fi
fi

# Get details
ALIAS=${1:-"my-key-alias"}
PASSWORD=${2:-""}

if [ -z "$PASSWORD" ]; then
    echo "Enter password for the keystore (at least 6 characters):"
    read -s PASSWORD
    echo
    echo "Confirm password:"
    read -s PASSWORD_CONFIRM
    echo

    if [ "$PASSWORD" != "$PASSWORD_CONFIRM" ]; then
        echo "❌ Passwords do not match!"
        exit 1
    fi
    
    if [ ${#PASSWORD} -lt 6 ]; then
         echo "❌ Password must be at least 6 characters!"
         exit 1
    fi
fi

echo "Generating keystore..."

keytool -genkey -v -keystore "$KEYSTORE_FILE" \
        -alias "$ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass "$PASSWORD" \
        -keypass "$PASSWORD" \
        -dname "CN=AntiAnxiety, OU=Mobile, O=AntiAnxiety, L=Unknown, ST=Unknown, C=US"

echo "✅ Keystore generated at: $KEYSTORE_FILE"

echo "Creating $PROPERTIES_FILE..."

cat > "$PROPERTIES_FILE" <<EOL
storePassword=$PASSWORD
keyPassword=$PASSWORD
keyAlias=$ALIAS
storeFile=upload-keystore.jks
EOL

echo "✅ Properties file created at: $PROPERTIES_FILE"
echo ""
echo "IMPORTANT: Add *.jks and keystore.properties to your .gitignore file to prevent leaking secrets!"
