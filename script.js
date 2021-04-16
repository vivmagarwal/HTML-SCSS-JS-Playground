console.log('index works!!');

for (let i=0; i<3; i++){
  console.log(i+1);
};

function Account(type) {
  this.type = type;
  this.balance = 0;
  this.openingYear = 2000;

  this.getInfo = function () {
    return (
      `
      Account Type : ${this.type},
      Balance : ${this.balance},
      Opening Year : ${this.openingYear}
      `
    );
  }
}

var myAccount = new Account("Savings");
myAccount.balance = 500;
myAccount.openingYear = new Date().getFullYear();
console.log(myAccount.getInfo());

