<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePlayerRequest extends FormRequest
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
            'player_list_id' => 'required|exists:player_lists,id',
            'name' => [
                'required',
                'string',
                'max:255',
                // Không trùng tên trong cùng player_list_id (case-insensitive)
                Rule::unique('players', 'name')
                    ->where('player_list_id', $this->player_list_id)
            ],
            'gender' => 'required|in:male,female',
            'level' => 'required|integer|min:1',
        ];
    }

    /**
     * Custom error messages (Vietnamese)
     */
    public function messages(): array
    {
        return [
            'player_list_id.required' => 'Vui lòng chọn danh sách VĐV.',
            'player_list_id.exists' => 'Danh sách VĐV không tồn tại.',

            'name.required' => 'Vui lòng nhập họ tên VĐV.',
            'name.string' => 'Họ tên VĐV không hợp lệ.',
            'name.max' => 'Họ tên VĐV tối đa 255 ký tự.',
            'name.unique' => 'Họ tên VĐV đã tồn tại trong danh sách này.',

            'gender.required' => 'Vui lòng chọn giới tính.',
            'gender.in' => 'Giới tính phải là male hoặc female.',

            'level.required' => 'Vui lòng nhập level (số).',
            'level.integer' => 'Level phải là số nguyên.',
            'level.min' => 'Level tối thiểu là 1.',
        ];
    }
}
