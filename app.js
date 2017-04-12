var express = require('express')
var app = express()
var parse = require('csv-parse')
var fs = require('fs')

app.get('/api/v1/shipments', function(req,res){
  var retdata = {records: []}
  var shipper = []
  isComp = (id) => {
    return id[2] === req.query.company_id
  }
  whatMode = (shipment) => {
    return shipment.mode === req.query.international_transportation_mode
  }
  deleteShow = (x) => {
    x.forEach((ship) => {
      delete ship.departDate
      delete ship.mode
    })
    retdata.records = x
    res.json(retdata)
  }
  showDef = (x,page = 1, max = 4) => {
    return shipper = x.slice((page-1)*max,((page-1)*max)+max)
  }

  if(!req.query.company_id) {
    res.status(422).json({errors:['company_id is required']})
    return
  }
  fs.readFile('./db/shipments.csv', function(err,data){
    parse(data, function(err,shipments){
      var fshipments = shipments.filter(isComp)
      var shipper = fshipments.map((ship) => {
        return {id: parseInt(ship[0]), name: ship[1], products: [], departDate: Date.parse(ship[6]), mode: ship[5]}
      })
      fs.readFile('./db/shipment_products.csv', function(err,data1){
        parse(data1, function(err,shipprods){
          shipper.forEach((ship) => {
            shipprods.forEach((prods) => {
              if(parseInt(prods[2]) === ship.id) {
                ship.products.push({quantity: parseInt(prods[3]), id: parseInt(prods[1])})
              }
            })
          })
          fs.readFile('./db/products.csv', function(err,data2){
            parse(data2, function(err,products){
              shipper.forEach((ship) => {
                ship.products.forEach((prod, i) => {
                  products.forEach((prod2) => {
                    if(parseInt(prod2[0]) === prod.id){
                      prod.sku = prod2[1]
                      prod.description = prod2[2]
                      prod.active_shipment_count = i + 1
                    }
                  })
                })
              })
              if(req.query.sort === 'international_departure_date') {
                console.log('it works')
                if(req.query.direction === 'asc') {
                  console.log('this works too')
                  shipper.sort(function(a,b) {
                    return a.departDate - b.departDate
                  })
                } if(req.query.direction === 'desc') {
                  console.log('this works too')
                  shipper.sort(function(a,b) {
                    return b.departDate - a.departDate
                  })
                }
                deleteShow(shipper)
                return
              }
              if(req.query.international_transportation_mode) {
                shipper = shipper.filter(whatMode)
                deleteShow(shipper)
                return
              }
              if(req.query.page) {
                if(req.query.per) {
                  console.log(req.query.per)
                  shipper = showDef(shipper,req.query.page,parseInt(req.query.per))
                  deleteShow(shipper)
                  return
                } else {
                  console.log('ITS THIS ONE')
                  shipper = showDef(shipper,req.query.page)
                  deleteShow(shipper)
                  return
                }
              }
              shipper = showDef(shipper)
              deleteShow(shipper)
              return
            })
          })
        })
      })
    })
  })
})


app.listen(3000,function(){
  console.log('listening on port 3000')
})
