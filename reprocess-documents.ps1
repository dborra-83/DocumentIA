# Reprocess pending documents
$documents = @(
    @{id="081c30aa-340c-4092-9827-19d28456ac86"; userId="14e8d448-10a1-70e9-9159-43943277899d"; vertical="legal"; s3Key="documents/14e8d448-10a1-70e9-9159-43943277899d/081c30aa-340c-4092-9827-19d28456ac86.pdf"; fileType="pdf"},
    @{id="91391987-19cd-4ce7-b7bc-d9106c271cc9"; userId="14e8d448-10a1-70e9-9159-43943277899d"; vertical="legal"; s3Key="documents/14e8d448-10a1-70e9-9159-43943277899d/91391987-19cd-4ce7-b7bc-d9106c271cc9.pdf"; fileType="pdf"},
    @{id="06c3afbf-69b6-465e-ba1d-dab73788059a"; userId="14e8d448-10a1-70e9-9159-43943277899d"; vertical="legal"; s3Key="documents/14e8d448-10a1-70e9-9159-43943277899d/06c3afbf-69b6-465e-ba1d-dab73788059a.pdf"; fileType="pdf"},
    @{id="44840148-adfd-4fe2-b62d-fcf44b865595"; userId="14e8d448-10a1-70e9-9159-43943277899d"; vertical="legal"; s3Key="documents/14e8d448-10a1-70e9-9159-43943277899d/44840148-adfd-4fe2-b62d-fcf44b865595.pdf"; fileType="pdf"},
    @{id="3b2f6eca-e1d0-499a-936e-9411da4cd277"; userId="14e8d448-10a1-70e9-9159-43943277899d"; vertical="legal"; s3Key="documents/14e8d448-10a1-70e9-9159-43943277899d/3b2f6eca-e1d0-499a-936e-9411da4cd277.pdf"; fileType="pdf"},
    @{id="3585623b-0abe-494b-a9e2-42c22d8f1e2e"; userId="14e8d448-10a1-70e9-9159-43943277899d"; vertical="legal"; s3Key="documents/14e8d448-10a1-70e9-9159-43943277899d/3585623b-0abe-494b-a9e2-42c22d8f1e2e.pdf"; fileType="pdf"},
    @{id="271b0574-8254-4d43-bb59-716caa1b9573"; userId="14e8d448-10a1-70e9-9159-43943277899d"; vertical="legal"; s3Key="documents/14e8d448-10a1-70e9-9159-43943277899d/271b0574-8254-4d43-bb59-716caa1b9573.pdf"; fileType="pdf"}
)

$stateMachineArn = "arn:aws:states:us-east-1:520754296204:stateMachine:DocumentProcessing-dev"

foreach ($doc in $documents) {
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $executionName = "reprocess-$($doc.id.Substring(0,8))-$timestamp"
    
    $inputObj = @{
        documentId = $doc.id
        userId = $doc.userId
        vertical = $doc.vertical
        s3Key = $doc.s3Key
        fileType = $doc.fileType
    }
    
    $inputJson = $inputObj | ConvertTo-Json -Compress
    $inputFile = "temp-input-$($doc.id).json"
    [System.IO.File]::WriteAllText($inputFile, $inputJson)
    
    Write-Host "Starting execution for document $($doc.id)..."
    aws stepfunctions start-execution `
        --state-machine-arn $stateMachineArn `
        --name $executionName `
        --input "file://$inputFile"
    
    Remove-Item $inputFile
    
    Start-Sleep -Seconds 2
}

Write-Host "`nAll documents queued for reprocessing!"
