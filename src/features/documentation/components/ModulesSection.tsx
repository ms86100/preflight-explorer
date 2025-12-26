import React, { useState, useEffect, useId, useRef } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Folder, Code, Settings, Users, GitBranch, Image, AlertCircle, Printer } from 'lucide-react';
import { moduleDocumentation } from '../data/moduleDocumentation';
import { moduleDiagrams } from '../data/moduleDiagrams';

// Initialize mermaid for inline diagrams
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: { htmlLabels: false, curve: 'basis' },
});

interface InlineMermaidDiagramProps {
  code: string;
  diagramId: string;
}

const InlineMermaidDiagram: React.FC<InlineMermaidDiagramProps> = ({ code, diagramId }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const uniqueId = useId().replace(/:/g, '');

  useEffect(() => {
    let mounted = true;
    
    const renderDiagram = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const cleanedCode = code.replace(/<br\/>/g, '\\n').replace(/<br>/g, '\\n');
        const id = `inline-mermaid-${diagramId}-${uniqueId}`;
        const { svg: renderedSvg } = await mermaid.render(id, cleanedCode);
        
        if (mounted) {
          setSvg(renderedSvg);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError('Diagram unavailable');
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(renderDiagram, 100);
    return () => { mounted = false; clearTimeout(timer); };
  }, [code, diagramId, uniqueId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px] bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[100px] bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="text-center p-4">
          <AlertCircle className="h-5 w-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white dark:bg-slate-900 rounded-lg p-3 overflow-visible print:overflow-visible"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export const ModulesSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const moduleRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const filteredModules = moduleDocumentation.filter(
    module =>
      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getModuleDiagrams = (moduleId: string) => {
    const diagrams = moduleDiagrams[moduleId];
    return diagrams ? [diagrams.sequence, diagrams.erd] : [];
  };

  const handlePrintModule = (moduleId: string) => {
    // Temporarily expand this module if not already
    const wasExpanded = expandedModules.includes(moduleId);
    if (!wasExpanded) {
      setExpandedModules([moduleId]);
    }
    
    // Wait for render then print
    setTimeout(() => {
      const moduleEl = moduleRefs.current[moduleId];
      if (moduleEl) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const module = moduleDocumentation.find(m => m.id === moduleId);
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>${module?.name || 'Module'} Documentation</title>
              <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  padding: 20px;
                  line-height: 1.6;
                  color: #1a1a1a;
                }
                h1 { font-size: 24px; margin-bottom: 8px; }
                h2 { font-size: 18px; margin: 16px 0 8px; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px; }
                h3 { font-size: 16px; margin: 12px 0 6px; }
                h4 { font-size: 14px; margin: 8px 0 4px; font-weight: 600; }
                p { margin: 4px 0; font-size: 14px; color: #666; }
                .section { margin: 16px 0; padding: 12px; border: 1px solid #e5e5e5; border-radius: 8px; }
                .diagram-container { 
                  background: #f9fafb; 
                  padding: 16px; 
                  border-radius: 8px; 
                  margin: 8px 0;
                  page-break-inside: avoid;
                }
                .diagram-container svg { max-width: 100%; height: auto; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0; }
                th, td { border: 1px solid #e5e5e5; padding: 8px; text-align: left; }
                th { background: #f5f5f5; font-weight: 600; }
                ul, ol { padding-left: 20px; font-size: 14px; }
                li { margin: 4px 0; }
                .badge { 
                  display: inline-block; 
                  padding: 2px 8px; 
                  border-radius: 4px; 
                  font-size: 11px;
                  background: #f0f0f0;
                  margin: 2px;
                }
                .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
                .mono { font-family: monospace; font-size: 12px; }
                @media print {
                  body { padding: 0; }
                  .section { page-break-inside: avoid; }
                }
              </style>
            </head>
            <body>
              <h1>${module?.name}</h1>
              <p>${module?.description}</p>
              ${moduleEl.innerHTML}
            </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        }
      }
      
      // Restore previous state
      if (!wasExpanded) {
        setExpandedModules([]);
      }
    }, 100);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Feature Modules</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Complete documentation of all {moduleDocumentation.length} feature modules in the application.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search modules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Module Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Folder className="w-4 h-4" />
        <span>Showing {filteredModules.length} of {moduleDocumentation.length} modules</span>
      </div>

      {/* Module List */}
      <Accordion 
        type="multiple" 
        value={expandedModules}
        onValueChange={setExpandedModules}
        className="space-y-3 sm:space-y-4"
      >
        {filteredModules.map((module) => {
          const diagrams = getModuleDiagrams(module.id);
          
          return (
            <AccordionItem
              key={module.id}
              value={module.id}
              className="border rounded-lg px-2 sm:px-4"
            >
              <AccordionTrigger className="hover:no-underline py-3 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-3 text-left flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Folder className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base">{module.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2 break-words">{module.description}</p>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    {diagrams.length > 0 && (
                      <Badge variant="outline" className="gap-1 text-xs hidden sm:flex">
                        <GitBranch className="h-3 w-3" />
                        {diagrams.length}
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 flex-shrink-0 print:hidden h-7 sm:h-8 px-2 sm:px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintModule(module.id);
                      }}
                    >
                      <Printer className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span className="hidden lg:inline text-xs">Print</span>
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-3 sm:pt-4 space-y-4 sm:space-y-6">
                <div ref={(el) => { moduleRefs.current[module.id] = el; }} className="space-y-4 sm:space-y-6">
                
                {/* 1. Purpose & Business Intent - FIRST */}
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                      </div>
                      <span className="break-words">Purpose & Business Intent</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Why this module exists and the business value it provides
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
                    <div className="bg-background rounded-lg p-3 sm:p-4 border">
                      <h4 className="font-semibold text-xs sm:text-sm mb-2 text-foreground">Overview</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">{module.purpose}</p>
                    </div>
                    <div className="grid gap-3 sm:gap-4">
                      <div className="bg-background rounded-lg p-3 sm:p-4 border">
                        <h4 className="font-semibold text-xs sm:text-sm mb-2 text-foreground flex items-center gap-2">
                          <span className="text-yellow-500">⚡</span> Preconditions
                        </h4>
                        <ul className="space-y-1.5">
                          {module.preconditions.map((pre, i) => (
                            <li key={i} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-yellow-500 mt-0.5 flex-shrink-0">•</span>
                              <span className="break-words">{pre}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-background rounded-lg p-3 sm:p-4 border">
                        <h4 className="font-semibold text-xs sm:text-sm mb-2 text-foreground flex items-center gap-2">
                          <span className="text-green-500">✓</span> Postconditions
                        </h4>
                        <ul className="space-y-1.5">
                          {module.postconditions.map((post, i) => (
                            <li key={i} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>
                              <span className="break-words">{post}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. User Flow - SECOND */}
                <Card className="border-blue-500/30 bg-blue-500/5">
                  <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <GitBranch className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                      </div>
                      <span className="break-words">User Flow & Journey</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Step-by-step walkthrough of how users interact with this module
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                    <div className="relative">
                      {/* Connection line */}
                      <div className="absolute left-3 sm:left-4 top-5 sm:top-6 bottom-5 sm:bottom-6 w-0.5 bg-blue-200 dark:bg-blue-800" />
                      
                      <ol className="space-y-3 sm:space-y-4">
                        {module.userFlow.map((step, i) => (
                          <li key={i} className="flex items-start gap-2 sm:gap-4 relative">
                            <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-500 text-white text-xs sm:text-sm flex items-center justify-center font-semibold z-10 shadow-md">
                              {i + 1}
                            </div>
                            <div className="flex-1 bg-background rounded-lg p-2 sm:p-3 border shadow-sm mt-0.5">
                              <p className="text-xs sm:text-sm text-foreground break-words">{step}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Role-Based Behavior - THIRD */}
                <Card className="border-purple-500/30 bg-purple-500/5">
                  <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                      </div>
                      <span className="break-words">Role-Based Behavior</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      What different user roles can do within this module
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                    <div className="grid gap-3 sm:gap-4">
                      <div className="bg-background rounded-lg p-3 sm:p-4 border">
                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                          <Badge variant="default" className="bg-purple-600 text-xs">Admin</Badge>
                          <span className="text-xs text-muted-foreground">Full access</span>
                        </div>
                        <ul className="space-y-1.5 sm:space-y-2">
                          {module.roles.admin.map((cap, i) => (
                            <li key={i} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-purple-500 mt-0.5 flex-shrink-0">▸</span>
                              <span className="break-words">{cap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-background rounded-lg p-3 sm:p-4 border">
                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                          <Badge variant="secondary" className="text-xs">User</Badge>
                          <span className="text-xs text-muted-foreground">Standard access</span>
                        </div>
                        <ul className="space-y-1.5 sm:space-y-2">
                          {module.roles.user.map((cap, i) => (
                            <li key={i} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-muted-foreground mt-0.5 flex-shrink-0">▸</span>
                              <span className="break-words">{cap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 4. Visual Diagrams - Sequence & ERD */}
                {diagrams.length > 0 && (
                  <Card className="border-primary/20">
                    <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Image className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                        </div>
                        <span className="break-words">Sequence Diagram & ERD</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Sequence diagram and entity relationship diagram for this module
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                      <div className="grid gap-3 sm:gap-4">
                        {diagrams.map((diagram) => (
                          <div key={diagram.id} className="border rounded-lg overflow-hidden">
                            <div className="p-2 sm:p-3 bg-muted/30 border-b flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-xs sm:text-sm truncate">{diagram.title}</h4>
                                <p className="text-xs text-muted-foreground hidden sm:block">{diagram.description}</p>
                              </div>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {diagram.type}
                              </Badge>
                            </div>
                            <div className="overflow-x-auto">
                              <InlineMermaidDiagram 
                                code={diagram.mermaidCode} 
                                diagramId={`${module.id}-${diagram.id}`} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 5. API Documentation */}
                {module.apiDocumentation && module.apiDocumentation.length > 0 && (
                  <Card className="border-blue-500/20">
                    <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                        </div>
                        <span className="break-words">API Documentation</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        REST API endpoints for this module
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                      <div className="-mx-3 sm:mx-0 overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16 sm:w-20 text-xs">Method</TableHead>
                              <TableHead className="text-xs">Endpoint</TableHead>
                              <TableHead className="hidden lg:table-cell text-xs">Description</TableHead>
                              <TableHead className="w-12 sm:w-20 text-xs">Auth</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {module.apiDocumentation.map((api, i) => (
                              <TableRow key={i}>
                                <TableCell className="p-2 sm:p-4">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      api.method === 'GET' ? 'bg-green-500/10 text-green-700 border-green-500/30' :
                                      api.method === 'POST' ? 'bg-blue-500/10 text-blue-700 border-blue-500/30' :
                                      api.method === 'PUT' ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30' :
                                      api.method === 'PATCH' ? 'bg-orange-500/10 text-orange-700 border-orange-500/30' :
                                      'bg-red-500/10 text-red-700 border-red-500/30'
                                    }`}
                                  >
                                    {api.method}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs p-2 sm:p-4 break-all">{api.path}</TableCell>
                                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground p-2 sm:p-4">{api.description}</TableCell>
                                <TableCell className="p-2 sm:p-4">
                                  <Badge variant={api.authentication === 'required' ? 'default' : 'secondary'} className="text-xs">
                                    {api.authentication === 'required' ? '🔐' : '🔓'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 6. Implementation Details */}
                {module.implementationDetails && module.implementationDetails.length > 0 && (
                  <Card className="border-green-500/20">
                    <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                        </div>
                        <span className="break-words">Implementation Details</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Technical implementation status and details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                      <div className="-mx-3 sm:mx-0 overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Area</TableHead>
                              <TableHead className="hidden sm:table-cell text-xs">Description</TableHead>
                              <TableHead className="w-24 sm:w-28 text-xs">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {module.implementationDetails.map((detail, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium text-xs sm:text-sm p-2 sm:p-4">{detail.area}</TableCell>
                                <TableCell className="hidden sm:table-cell text-xs text-muted-foreground p-2 sm:p-4">{detail.description}</TableCell>
                                <TableCell className="p-2 sm:p-4">
                                  <Badge 
                                    variant="outline"
                                    className={`text-xs ${
                                      detail.status === 'implemented' ? 'bg-green-500/10 text-green-700 border-green-500/30' :
                                      detail.status === 'partial' ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30' :
                                      'bg-slate-500/10 text-slate-600 border-slate-500/30'
                                    }`}
                                  >
                                    {detail.status === 'implemented' ? '✓' : 
                                     detail.status === 'partial' ? '◐' : '○'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 7. File Structure */}
                <Card>
                  <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <span className="break-words">File Structure</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Source code organization for this module
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                      <div className="bg-muted/30 rounded-lg p-3 sm:p-4 border">
                        <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          Components
                        </h4>
                        {module.components.length > 0 ? (
                          <ul className="space-y-1 sm:space-y-1.5 text-muted-foreground">
                            {module.components.map((comp, i) => (
                              <li key={i} className="font-mono text-xs bg-background rounded px-2 py-1 break-all">{comp}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground italic text-xs">No components</p>
                        )}
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 sm:p-4 border">
                        <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                          Hooks
                        </h4>
                        {module.hooks.length > 0 ? (
                          <ul className="space-y-1 sm:space-y-1.5 text-muted-foreground">
                            {module.hooks.map((hook, i) => (
                              <li key={i} className="font-mono text-xs bg-background rounded px-2 py-1 break-all">{hook}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground italic text-xs">No hooks</p>
                        )}
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 sm:p-4 border">
                        <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                          Services
                        </h4>
                        {module.services.length > 0 ? (
                          <ul className="space-y-1 sm:space-y-1.5 text-muted-foreground">
                            {module.services.map((svc, i) => (
                              <li key={i} className="font-mono text-xs bg-background rounded px-2 py-1 break-all">{svc}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground italic text-xs">No services</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 8. Edge Cases */}
                <Card>
                  <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
                      </div>
                      <span className="break-words">Edge Cases & Error Handling</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Known edge cases and how they are handled
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {module.edgeCases.map((edge, i) => (
                        <Badge key={i} variant="outline" className="text-xs py-1 sm:py-1.5 px-2 sm:px-3 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
                          {edge}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
