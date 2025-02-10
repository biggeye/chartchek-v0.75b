import { DocumentTextIcon, TableCellsIcon, PresentationChartBarIcon, PhotoIcon, CodeBracketIcon, ArchiveBoxIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
export default function GetFileIcon(extension: string) {
    const Icon = () => {
    switch (extension) {
      case 'doc':
      case 'docx':
      case 'pdf':
      case 'txt':
      case 'md':
        return <DocumentTextIcon className="h-6 w-6 text-blue-500" />;
      case 'csv':
      case 'xlsx':
        return <TableCellsIcon className="h-6 w-6 text-green-500" />;
      case 'pptx':
        return <PresentationChartBarIcon className="h-6 w-6 text-orange-500" />;
      case 'jpeg':
      case 'jpg':
      case 'png':
      case 'gif':
      case 'webp':
        return <PhotoIcon className="h-6 w-6 text-purple-500" />;
      case 'c':
      case 'cpp':
      case 'css':
      case 'go':
      case 'html':
      case 'java':
      case 'js':
      case 'json':
      case 'php':
      case 'py':
      case 'rb':
      case 'ts':
      case 'xml':
        return <CodeBracketIcon className="h-6 w-6 text-yellow-500" />;
      case 'zip':
      case 'tar':
        return <ArchiveBoxIcon className="h-6 w-6 text-red-500" />;
      case 'pkl':
      case 'tex':
      default:
        return <DocumentDuplicateIcon className="h-6 w-6 text-gray-500" />;
    }
  };
  return Icon;
}