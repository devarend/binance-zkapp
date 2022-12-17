
<h1 align="center">
  Binance zkApp
  <br>
</h1>

<h4 align="center">Binance zkApp which uses an oracle from Binance Test API, oracle can be found <a href="https://github.com/devarend/binance-oracle" target="_blank">here</a></h4>

![screenshot](https://user-images.githubusercontent.com/116919663/208222357-ce746467-7bb2-4760-bb1c-140b9a0ce731.png)

## Key Features

* BNB balance check which checks if your balance is at least 1000 BNB.
* Trader check which checks if you are a trader by checking the amount of trades, in this case 10 BNB trades or above.
* Generate 10 trades so you can pass the trader check
* Refresh the state
* Running two different smart contracts
## How To Use
```bash
# Install
$ yarn install

# Run development mode
$ yarn dev

# Build production
$ yarn build

# Run the build
$ yarn start
```
## LICENSE

```
MIT License

Copyright (c) 2022 Arend

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
