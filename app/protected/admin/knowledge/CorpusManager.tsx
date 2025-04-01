// app/protected/admin/knowledge/CorpusManager.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TextArea from "@/components/ui/text-area";
import { useKnowledgeStore } from "@/store/knowledgeStore";
import { Loader2, Plus } from "lucide-react";
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

export default function CorpusManager() {
    const {
        corpora,
        createCorpus,
        setSelectedCorpusId,
        selectedCorpusId,
        isLoading
    } = useKnowledgeStore();

    const [newCorpusName, setNewCorpusName] = useState("");
    const [newCorpusDescription, setNewCorpusDescription] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleCreateCorpus = async () => {
        if (!newCorpusName.trim()) return;

        await createCorpus(newCorpusName, newCorpusDescription);

        // Reset form
        setNewCorpusName("");
        setNewCorpusDescription("");
        setIsDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Knowledge Corpora</h3>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button 
                           variant="outline"
                           color="cyan">
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Corpus
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
                                <Label htmlFor="corpus-name">Corpus Name</Label>
                                <Input
                                    id="corpus-name"
                                    placeholder="e.g., Clinical Guidelines"
                                    value={newCorpusName}
                                    onChange={(e) => setNewCorpusName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="corpus-description">Description (Optional)</Label>
                                <TextArea
                                    id="corpus-description"
                                    placeholder="Describe the purpose of this corpus"
                                    value={newCorpusDescription}
                                    onChange={(e) => setNewCorpusDescription(e.target.value)}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                outline
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                   className="p-0 h-auto font-medium"
                                onClick={handleCreateCorpus}
                                disabled={!newCorpusName.trim() || isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Corpus
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {corpora.length === 0 ? (
                <div className="text-center p-6 border-2 border-dashed rounded-lg">
                    <p className="text-gray-500">No corpora found. Create your first corpus to get started.</p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Display Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {corpora.map((corpus) => (
                            <TableRow
                                key={corpus.id}
                                className={selectedCorpusId === corpus.id ? "bg-gray-100" : ""}
                            >
                                <TableCell className="font-medium">{corpus.display_name}</TableCell>
                                <TableCell>{corpus.description || "-"}</TableCell>
                                <TableCell>{new Date(corpus.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Button
                                        style={{
                                            backgroundColor: '#4f46e5', // indigo-600
                                            color: 'white',
                                            borderColor: '#4338ca' // indigo-700
                                        }}
                                        onClick={handleCreateCorpus}
                                        disabled={!newCorpusName.trim() || isLoading}
                                    >
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Corpus
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}