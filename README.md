# Telegram Bulk Sender

Noter que le code n'est pas spécialement propre (et encore moins sécurisé) mais bon ça fait le boulot comme on dit dans le milieu.

J'avais juste besoin de rapidement créer un système permettant d'envoyer un même message dans de nombreux channels [`Telegram`](https://telegram.org/) en même temps.

# Installation

https://airgram.netlify.app/guides/installation

Déjà, compiler la bibliothèque `TDlib` qui est la bibliothèque officielle de Telegram pour créer des clients, elle est codée en C++, donc on doit la compiler :
- https://github.com/tdlib/td#building
- https://tdlib.github.io/td/build.html?language=JavaScript

Dans mon cas :
```bash
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install make git zlib1g-dev libssl-dev gperf php-cli cmake g++
git clone https://github.com/tdlib/td.git
cd td
rm -rf build
mkdir build
cd build
cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX:PATH=../tdlib ..
cmake --build . --target install
cd ..
cd ..
ls -l td/tdlib
```

Puis, installer `node-gyp` qui permet de compiler des modules natifs pour `Node.js`. Ici, cela va donc permettre d'utiliser `TDlib` en JavaScript, par l'intermédiaire d'`Airgram` :
- https://github.com/nodejs/node-gyp#installation

```bash
npm install -g node-gyp
```

Enfin, installer le module `airgram` :
```bash
npm install airgram --save
```

# Liens utiles

## Enregistrer et gérer l'application
https://my.telegram.org/apps

## Coeur de Telegram client : bibliothèque TDlib
https://core.telegram.org/tdlib

## Bibliothèque Airgram
https://airgram.netlify.app/
https://github.com/airgram/airgram
