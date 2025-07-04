"use client";

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, User, Mail, Edit, Trash2, LoaderCircle } from "lucide-react"
import relativeTime from 'dayjs/plugin/relativeTime'
import dayjs from "dayjs";
import { z } from "zod"
import { toast } from "sonner"

dayjs.extend(relativeTime)

const contactSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters")
    .trim(),
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must not exceed 100 characters")
    .toLowerCase()
    .trim(),
})

type ContactFormData = z.infer<typeof contactSchema>

interface Contact {
  id: string
  name: string
  email: string
  createdAt: string
}

interface FormErrors {
  name?: string
  email?: string
}

export default function ContactManager() {
  const [contacts, setContacts] = useState<Contact[] | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchContacts = () => {
    setContacts(null)
    fetch('/api/contacts').then((data) => {
      data.json().then(
        (json) => {
          setContacts(json.data)
        }
      )
    })
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  const validateForm = (data: ContactFormData): FormErrors => {
    try {
      contactSchema.parse(data)
      return {}
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: FormErrors = {}
        error.errors.forEach((err) => {
          if (err.path[0] === 'name') {
            errors.name = err.message
          } else if (err.path[0] === 'email') {
            errors.email = err.message
          }
        })
        return errors
      }
      return {}
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const newFormData = {
      ...formData,
      [name]: value,
    }
    setFormData(newFormData)

    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
    })
    setFormErrors({})
    setEditingContact(null)
  }

  const handleAddContact = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  const handleEditContact = (contact: Contact) => {
    setFormData({
      name: contact.name,
      email: contact.email,
    })
    setEditingContact(contact)
    setFormErrors({})
    setIsEditDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const errors = validateForm(formData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setIsSubmitting(false)
      return
    }

    try {
      const url = editingContact ? `/api/contacts/${editingContact.id}` : "/api/contacts"
      const method = editingContact ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${editingContact ? 'update' : 'create'} contact`)
      }

      resetForm()
      setIsAddDialogOpen(false)
      setIsEditDialogOpen(false)
      fetchContacts()
    } catch (error) {
      console.error(error)
      toast.error(`Error ${editingContact ? 'updating' : 'creating'} contact`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) {
      return
    }

    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete contact")
      }

      fetchContacts()
    } catch (error) {
      console.error(error)
      toast.error("Error deleting contact")
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Contact Manager</h1>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" onClick={handleAddContact}>
                <Plus className="h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <DialogDescription>
                Fill in the contact information below. All fields are required.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-name">Name *</Label>
                  <Input
                    id="add-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className={formErrors.name ? "border-red-500" : ""}
                    disabled={isSubmitting}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-email">Email *</Label>
                  <Input
                    id="add-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className={formErrors.email ? "border-red-500" : ""}
                    disabled={isSubmitting}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
                      Adding...
                    </>
                  ) : (
                    'Add Contact'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
              <DialogDescription>
                Update the contact information below.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className={formErrors.name ? "border-red-500" : ""}
                    disabled={isSubmitting}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className={formErrors.email ? "border-red-500" : ""}
                    disabled={isSubmitting}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Contact'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {contacts == null ? (
          <div className="flex justify-center items-center">
            <LoaderCircle className="animate-spin w-12 h-12" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <User className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                      <p className="text-2xl font-bold">{contacts.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Mail className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">This Month</p>
                      <p className="text-2xl font-bold">
                        {contacts.filter((c) => {
                          const contactDate = new Date(c.createdAt)
                          const now = new Date()
                          return (
                            contactDate.getMonth() === now.getMonth() &&
                            contactDate.getFullYear() === now.getFullYear()
                          )
                        }).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contacts.map((contact, index) => (
                <Card key={contact.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="font-bold text-xl text-white">{index + 1}.</span>
                        </div>
                        <div>
                          <CardTitle className="text-lg">{contact.name}</CardTitle>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditContact(contact)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(contact.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {contact.email && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">{contact.email}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Added {dayjs(contact.createdAt).fromNow()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {contacts.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No contacts yet</h3>
                <p className="text-muted-foreground mb-4">Get started by adding your first contact.</p>
                <Button onClick={handleAddContact}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Contact
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
