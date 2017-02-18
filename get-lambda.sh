res=$(aws lambda get-function --function-name $1 --profile tony | jq -r '.Code.Location' )
curl $res > lambdas/$1/l.zip
unzip lambdas/$1/l.zip
rm lambdas/$1/l.zip

