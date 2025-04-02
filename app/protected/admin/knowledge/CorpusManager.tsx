// app/protected/admin/knowledge/CorpusManager.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TextArea from "@/components/ui/text-area";
import { useKnowledgeStore } from "@/store/knowledgeStore";
import { Loader2, Plus, Trash, Search, Edit } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function CorpusManager() {
    const {
        corpora,
        fetchCorpora,
        createCorpus,
        deleteCorpus,
        getCorpus,
        queryCorpus,
        setSelectedCorpusId,
        selectedCorpusId,
        isLoading,
        error
    } = useKnowledgeStore();

    const [newCorpusName, setNewCorpusName] = useState("");
    const [newCorpusDescription, setNewCorpusDescription] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [corpusToDelete, setCorpusToDelete] = useState<string | null>(null);
    const [queryText, setQueryText] = useState("");
    const [queryResults, setQueryResults] = useState<any>(null);
    const [isQuerying, setIsQuerying] = useState(false);

    useEffect(() => {
        fetchCorpora();
    }, []);

    useEffect(() => {
        if (error) {
            toast({
                title: "Error",
                description: error,
                variant: "destructive"
            });
        }
    }, [error]);

    const handleCreateCorpus = async () => {
        if (!newCorpusName.trim()) return;

        await createCorpus(newCorpusName, newCorpusDescription);

        // Reset form
        setNewCorpusName("");
        setNewCorpusDescription("");
        setIsCreateDialogOpen(false);
    };

    const handleDeleteCorpus = async (corpusName: string) => {
        setCorpusToDelete(corpusName);
        setIsDeleteDialogOpen(true);
    };

    const confirmDeleteCorpus = async () => {
        if (!corpusToDelete) return;

        try {
            await deleteCorpus(corpusToDelete);
            toast({
                title: "Success",
                description: "Corpus deleted successfully",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete corpus",
                variant: "destructive"
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setCorpusToDelete(null);
        }
    };

    const handleQueryCorpus = async (corpusName: string) => {
        if (!queryText.trim()) {
            toast({
                title: "Error",
                description: "Please enter a query",
                variant: "destructive"
            });
            return;
        }

        setIsQuerying(true);
        try {
            const results = await queryCorpus(corpusName, queryText);
            setQueryResults(results);
            toast({
                title: "Success",
                description: "Query completed successfully",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to query corpus",
                variant: "destructive"
            });
        } finally {
            setIsQuerying(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Knowledge Corpora</h2>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Corpus
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Knowledge Corpus</DialogTitle>
                            <DialogDescription>
                                A corpus is a collection of documents that can be searched together.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={newCorpusName}
                                    onChange={(e) => setNewCorpusName(e.target.value)}
                                    placeholder="Enter corpus name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <TextArea
                                    id="description"
                                    value={newCorpusDescription}
                                    onChange={(e) => setNewCorpusDescription(e.target.value)}
                                    placeholder="Enter corpus description"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={handleCreateCorpus}
                                disabled={isLoading || !newCorpusName.trim()}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <>
                    {corpora && corpora.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {corpora.map((corpus) => (
                                    <TableRow
                                        key={corpus.name}
                                        className={selectedCorpusId === corpus.name ? "bg-gray-100" : ""}
                                    >

                                        <TableCell className="font-medium">
                                            {corpus.displayName || "Unnamed Corpus"}
                                        </TableCell>
                                        <TableCell>{corpus.description || "No description"}</TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedCorpusId(corpus.name)}
                                                >
                                                    Select
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteCorpus(corpus.name)}
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm">
                                                            <Search className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Query Corpus: {corpus.displayName}</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="query">Query</Label>
                                                                <Input
                                                                    id="query"
                                                                    value={queryText}
                                                                    onChange={(e) => setQueryText(e.target.value)}
                                                                    placeholder="Enter your query"
                                                                />
                                                            </div>
                                                            <Button
                                                                onClick={() => handleQueryCorpus(corpus.name)}
                                                                disabled={isQuerying || !queryText.trim()}
                                                            >
                                                                {isQuerying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                Search
                                                            </Button>

                                                            {queryResults && (
                                                                <div className="mt-4 p-4 border rounded-md">
                                                                    <h3 className="font-medium mb-2">Results:</h3>
                                                                    <pre className="text-sm overflow-auto max-h-60">
                                                                        {JSON.stringify(queryResults, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No corpora found. Create your first corpus to get started.</p>
                        </div>
                    )}
                </>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the corpus
                            and all its documents.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteCorpus}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}