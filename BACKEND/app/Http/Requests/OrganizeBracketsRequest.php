<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrganizeBracketsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'player_list_id' => 'sometimes|exists:player_lists,id', // Optional if provided in URL
            'number_of_brackets' => 'required|integer|min:1|max:50',
            'gender_distribution' => 'required|in:mixed,male_only,female_only',
        ];
    }
}
