# Qanda_API
node.js 에서 사용 가능한 콴다 api 모듈입니다.

# Usage
### .search(경로 or url)
```javascript
const qanda = require("qanda");
qanda.search("problem.png").then(a=>console.log(a));
//result - [{question:url,answer:[url,url...
```
### .calculation(식)
```javascript
const qanda = require("qanda");
qanda.calculation("2x = 10").then(a=>console.log(a));
//result - {title:"방정식을 푸세요",solution:"x = 5",steps:[...
```
<br>
두 함수 둘 다 promise 이므로 알아서 await 또는 then




