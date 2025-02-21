// use the following logic to complete the API route here:

/*
Delete vector store file
Beta
delete
 
https://api.openai.com/v1/vector_stores/{vector_store_id}/files/{file_id}
Delete a vector store file. This will remove the file from the vector store but the file itself will not be deleted. To delete the file, use the delete file endpoint.

Path parameters
vector_store_id
string

Required
The ID of the vector store that the file belongs to.

file_id
string

Required
The ID of the file to delete.

Returns
Deletion status

Example request
import OpenAI from "openai";
const openai = new OpenAI();

async function main() {
  const deletedVectorStoreFile = await openai.beta.vectorStores.files.del(
    "vs_abc123",
    "file-abc123"
  );
  console.log(deletedVectorStoreFile);
}

main();
Response
{
  id: "file-abc123",
  object: "vector_store.file.deleted",
  deleted: true
}
*/  // AI!