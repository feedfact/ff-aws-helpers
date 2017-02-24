awslogs get /aws/lambda/feedfact  --profile tony --start="1 day" -f "[match]" | grep match
