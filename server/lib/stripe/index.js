var stripe = require("stripe")("sk_test_17xTMwlg0mDSQd15E2XPsT00");
var Rx = require('rxjs/Rx');

// Charge the user's card:
exports.payment = function (token) {
    return Rx.Observable.create((observer) => {
        var charge = stripe.charges.create({
            amount: 2000,
            currency: "eur",
            description: "Example charge",
            source: token,
        }, function(err, charge) {
            if(!err){
                observer.next(charge);
                observer.complete();
            } else {
                observer.error(err);
                observer.complete();
            }
        });
    });
}