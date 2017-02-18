BASE=$(pwd)
cd lambdas/$1
zip l.zip *
zip_location=fileb://$BASE/lambdas/$1/l.zip
aws lambda update-function-code --function-name $1 --zip-file $zip_location --profile tony
rm l.zip
cd ../../

