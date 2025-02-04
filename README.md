# Smart Shelving System Development Repository

## Run System
1. For security reasons, some files are kept secret with git-crypt. To unlock these files, you must download git-crypt. For example, if you are on OSX, you may run `brew install git-crypt`. Then, you may clone the repo and unlock the files with the provided key file by running `git-crypt unlock <path to key>`.

2. To run the application (must unlock the secret file from step 1 first), run the `run_management.sh` file in the project's top directory.

## Directory Layout
management: contains the files that run the actual application using QtDesigner and Python

secret: contains the json file with the information of the datasheet. Must be unlocked using the key file and git-crypt.

testing: contains files for testing