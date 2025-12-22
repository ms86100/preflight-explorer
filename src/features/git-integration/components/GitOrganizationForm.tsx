import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCreateGitOrganization } from '../hooks/useGitOrganizations';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  provider_type: z.enum(['gitlab', 'github', 'bitbucket']),
  host_url: z.string().url('Must be a valid URL'),
  access_token: z.string().min(1, 'Access token is required'),
  webhook_secret: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const PROVIDER_DEFAULTS: Record<string, string> = {
  gitlab: 'https://gitlab.com',
  github: 'https://github.com',
  bitbucket: 'https://bitbucket.org',
};

interface GitOrganizationFormProps {
  onSuccess?: () => void;
}

export function GitOrganizationForm({ onSuccess }: GitOrganizationFormProps) {
  const [open, setOpen] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const createOrg = useCreateGitOrganization();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      provider_type: 'gitlab',
      host_url: PROVIDER_DEFAULTS.gitlab,
      access_token: '',
      webhook_secret: '',
    },
  });

  const selectedProvider = form.watch('provider_type');

  const handleProviderChange = (value: string) => {
    form.setValue('provider_type', value as FormValues['provider_type']);
    form.setValue('host_url', PROVIDER_DEFAULTS[value] || '');
  };

  const onSubmit = async (values: FormValues) => {
    await createOrg.mutateAsync({
      name: values.name,
      provider_type: values.provider_type,
      host_url: values.host_url,
      access_token_encrypted: values.access_token,
      webhook_secret: values.webhook_secret || undefined,
    });
    form.reset();
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Git Provider
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect Git Provider</DialogTitle>
          <DialogDescription>
            Connect your GitLab, GitHub, or Bitbucket to link repositories with issues.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My GitLab" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="provider_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={handleProviderChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gitlab">GitLab</SelectItem>
                      <SelectItem value="github">GitHub</SelectItem>
                      <SelectItem value="bitbucket">Bitbucket</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="host_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Host URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://gitlab.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Use the default URL or your self-hosted instance URL.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="access_token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Access Token</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showToken ? 'text' : 'password'}
                        placeholder="Enter your access token"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowToken(!showToken)}
                      >
                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    {selectedProvider === 'gitlab' && 'Create a token with api scope in GitLab > Settings > Access Tokens'}
                    {selectedProvider === 'github' && 'Create a token with repo scope in GitHub > Settings > Developer settings > Personal access tokens'}
                    {selectedProvider === 'bitbucket' && 'Create an app password with repository read/write permissions'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="webhook_secret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook Secret (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Optional secret for webhook validation"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Used to validate incoming webhook requests.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createOrg.isPending}>
                {createOrg.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Connect
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
